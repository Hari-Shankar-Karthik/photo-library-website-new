document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("uploadForm");
    const imagesInput = document.getElementById("images");
    const urlInput = document.getElementById("imageURL");

    form.addEventListener("submit", function (event) {
        let isValid = true;

        // Validate file count only when URL is empty
        if (imagesInput.files.length > 10 && urlInput.value.trim() === "") {
            imagesInput.classList.add("is-invalid");
            imagesInput.nextElementSibling.style.display = "block"; // Show invalid feedback
            isValid = false;
        } else {
            imagesInput.classList.remove("is-invalid");
            imagesInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
        }

        // Validate only one field is filled (either file or URL)
        if (
            (imagesInput.files.length > 0 && urlInput.value.trim() !== "") ||
            (imagesInput.files.length === 0 && urlInput.value.trim() === "")
        ) {
            urlInput.classList.add("is-invalid");
            imagesInput.classList.add("is-invalid");
            urlInput.nextElementSibling.style.display = "block"; // Show invalid feedback
            imagesInput.nextElementSibling.style.display = "block"; // Show invalid feedback
            isValid = false;
        } else {
            urlInput.classList.remove("is-invalid");
            imagesInput.classList.remove("is-invalid");
            urlInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
            imagesInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
        }

        if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
        }
    });

    // Real-time validation for file input
    imagesInput.addEventListener("change", function () {
        // Only validate the file count if URL field is empty
        if (imagesInput.files.length > 10 && urlInput.value.trim() === "") {
            imagesInput.classList.add("is-invalid");
            imagesInput.nextElementSibling.style.display = "block"; // Show invalid feedback
        } else {
            imagesInput.classList.remove("is-invalid");
            imagesInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
        }

        // Check if both fields are filled
        if (imagesInput.files.length > 0 && urlInput.value.trim() !== "") {
            urlInput.classList.add("is-invalid");
            imagesInput.classList.add("is-invalid");
            urlInput.nextElementSibling.style.display = "block"; // Show invalid feedback
            imagesInput.nextElementSibling.style.display = "block"; // Show invalid feedback
        } else {
            urlInput.classList.remove("is-invalid");
            imagesInput.classList.remove("is-invalid");
            urlInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
            imagesInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
        }
    });

    // Real-time validation for URL input
    urlInput.addEventListener("input", function () {
        // Check if both fields are filled
        if (imagesInput.files.length > 0 && urlInput.value.trim() !== "") {
            urlInput.classList.add("is-invalid");
            imagesInput.classList.add("is-invalid");
            urlInput.nextElementSibling.style.display = "block"; // Show invalid feedback
            imagesInput.nextElementSibling.style.display = "block"; // Show invalid feedback
        } else {
            urlInput.classList.remove("is-invalid");
            imagesInput.classList.remove("is-invalid");
            urlInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
            imagesInput.nextElementSibling.style.display = "none"; // Hide invalid feedback
        }
    });
});
