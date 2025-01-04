from flask import Flask, request, jsonify
import requests
from PIL import Image
from io import BytesIO
from transformers import CLIPProcessor, CLIPModel
import torch
from torch.nn.functional import cosine_similarity
import matplotlib.pyplot as plt


def create_app():
    # Set up device: Use GPU if available, otherwise fallback to CPU
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    # Load the model and processor
    model_id = "openai/clip-vit-base-patch32"
    processor = CLIPProcessor.from_pretrained(model_id)
    model = CLIPModel.from_pretrained(model_id).to(device)

    app = Flask(__name__)

    @app.route("/process", methods=["POST"])
    def get_embedding():
        # Get the URL from the request body
        data = request.json
        image_url = data.get("imageURL")

        if not image_url:
            return jsonify({"error": "Image URL is required"}), 400

        response = requests.get(image_url)

        if response.status_code != 200:
            return jsonify({"error": "Failed to download image"}), 400

        # Load the image
        image = Image.open(BytesIO(response.content))

        # Process the image
        inputs = processor(images=image, return_tensors="pt", padding=True)
        inputs = {key: value.to(device) for key, value in inputs.items()}

        # Compute the embedding
        with torch.inference_mode():
            image_embedding = model.get_image_features(**inputs).squeeze()

        # Return the embedding as a list
        print(image_embedding)
        return jsonify({"embedding": image_embedding.tolist()})

    TEMPERATURE = 0.01
    THRESHOLD = 0.15

    @app.route("/search", methods=["POST"])
    def search_images():
        # Get the search query and the embeddings from the request
        data = request.json
        search_query = data.get("searchQuery")
        embeddings = data.get("embeddings")

        if not search_query or not embeddings:
            return jsonify({"error": "Search query and embeddings are required"}), 400

        # Compute the text embedding
        inputs = processor(text=[search_query], return_tensors="pt", padding=True)
        inputs = {key: value.to(device) for key, value in inputs.items()}

        with torch.inference_mode():
            text_embedding = model.get_text_features(**inputs).squeeze()

        # Convert embeddings to PyTorch tensors
        image_embeddings = torch.tensor(embeddings, device=device)

        # Calculate cosine similarity
        similarities = cosine_similarity(
            text_embedding.unsqueeze(0), image_embeddings
        ).squeeze()

        # Apply softmax (with temperature) and filter results based on threshold
        probabilities = (similarities / TEMPERATURE).softmax(dim=0)
        print(probabilities)
        result = torch.where(probabilities >= THRESHOLD)[0].tolist()

        return jsonify({"result": result})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
