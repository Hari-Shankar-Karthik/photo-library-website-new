import os
import requests
from tqdm import tqdm

# Configuration
UNSPLASH_ACCESS_KEY = "qGZH0hMvwG1BphZ5mWdMN8pEljHzZU-Mf2N35ZjHCuA"
THEME = "everyday"
IMAGE_COUNT = 50
OUTPUT_FOLDER = "images"


def download_image(url, output_path):
    """Download a single image from a URL to the specified output path."""
    response = requests.get(url, stream=True)
    if response.status_code == 200:
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(1024):
                f.write(chunk)
    else:
        print(f"Failed to download {url}")


def fetch_unsplash_images(query, count, access_key):
    """Fetch image URLs from Unsplash based on the query."""
    url = f"https://api.unsplash.com/photos/random"
    headers = {"Authorization": f"Client-ID {access_key}"}
    params = {"query": query, "count": count}

    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching images: {response.status_code} - {response.text}")
        return []


def main():
    # Ensure output folder exists
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # Fetch image metadata
    print("Fetching image URLs...")
    images = fetch_unsplash_images(THEME, IMAGE_COUNT, UNSPLASH_ACCESS_KEY)
    if not images:
        print("No images fetched. Exiting.")
        return

    # Download images
    print(f"Downloading {len(images)} images to '{OUTPUT_FOLDER}'...")
    for i, image in enumerate(tqdm(images), 1):
        image_url = image.get("urls", {}).get("full")
        if image_url:
            output_path = os.path.join(OUTPUT_FOLDER, f"image_{i}.jpg")
            download_image(image_url, output_path)
        else:
            print(f"Image {i} has no URL. Skipping.")

    print("Download complete.")


if __name__ == "__main__":
    main()
