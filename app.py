from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from PIL import Image
import torch
import os
import pickle
import requests
from transformers import CLIPModel, CLIPProcessor

# Initialize FastAPI
app = FastAPI()

# Initialize CLIP model and processor
model_id = "openai/clip-vit-base-patch32"
processor = CLIPProcessor.from_pretrained(model_id)
model = CLIPModel.from_pretrained(model_id)


# Pydantic model for input
class ImageURL(BaseModel):
    url: str


# Endpoint to process image and generate embedding
@app.post("/process")
async def process_image(input_data: ImageURL):
    # Temporary paths for image and embedding storage
    temp_image_path = "temp_image.jpg"
    embedding_path = "embeddings.pkl"

    try:
        # Download the image from the URL
        response = requests.get(input_data.url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download the image.")

        with open(temp_image_path, "wb") as f:
            f.write(response.content)

        # Load the image
        image = Image.open(temp_image_path)

        # Preprocess the image
        inputs = processor(images=image, return_tensors="pt", padding=True)

        # Compute the embedding
        with torch.inference_mode():
            image_embedding = model.get_image_features(**inputs).squeeze()

        # Load or initialize the embedding store
        if os.path.exists(embedding_path):
            with open(embedding_path, "rb") as f:
                embedding_store = pickle.load(f)
        else:
            embedding_store = {}

        # Update the store
        embedding_store[input_data.url] = image_embedding
        with open(embedding_path, "wb") as f:
            pickle.dump(embedding_store, f)

        # Return the .pkl file as response
        return FileResponse(
            embedding_path,
            media_type="application/octet-stream",
            filename="embeddings.pkl",
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Clean up temporary files
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)


# Updated Pydantic model to accept both `search_query` and `embeddings`
class EmbeddingData(BaseModel):
    search_query: str
    embeddings: list


@app.post("/search")
async def search_images(input_data: EmbeddingData):
    try:
        # Extract the search_query and embeddings from the input data
        search_query = input_data.search_query
        embeddings = input_data.embeddings

        # For now, return a dummy response
        return {
            "search_query": search_query,
            "length": len(embeddings),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
