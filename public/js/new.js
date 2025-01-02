document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("uploadForm");
    const imagesInput = document.getElementById("images");
    const urlInput = document.getElementById("imageURL");
    const loadingContainer = document.getElementById("loading-container");

    // Form Validation
    form.addEventListener("submit", function (event) {
        let isValid = true;

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
            return; // Prevent form submission if invalid
        }

        // Show the loading spinner before submitting
        loadingContainer.style.display = "block";

        // Create FormData object
        const formData = new FormData(form);

        // Use Axios to handle the form submission
        axios
            .post(form.action, formData)
            .then(function (response) {
                // Handle success
                window.location.href = response.data.redirectURL;
            })
            .catch(function (error) {
                // Handle error
                alert("Upload failed!");
            });
    });

    // Real-time validation for file input
    imagesInput.addEventListener("change", function () {
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
