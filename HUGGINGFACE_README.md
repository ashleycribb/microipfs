# How to Deploy This Project on Hugging Face

This guide provides a step-by-step process for deploying the `microipfs` application to the Hugging Face Hub, creating both a code repository and a running "Space" for the application.

## Part 1: Create a Hugging Face Code Repository

1.  **Create a Hugging Face Account:** If you don't already have one, sign up for an account at [huggingface.co](https://huggingface.co/).
2.  **Create a New Repository:**
    *   Navigate to your profile and click on "New" -> "New Repository".
    *   Select "App" as the repository type.
    *   Give it a name (e.g., `microipfs`).
    *   Choose a license (e.g., `MIT`).
    *   Decide whether you want the repository to be public or private.
    *   Click "Create repository".
3.  **Upload Your Code:**
    *   Clone the newly created repository to your local machine.
    *   Copy all the files from this project (including the `Dockerfile` we created) into the cloned repository.
    *   Commit and push the files to the Hugging Face Hub.

## Part 2: Create and Configure a Hugging Face Space

1.  **Create a New Space:**
    *   Navigate to your profile and click on "New" -> "New Space".
    *   Give your Space a name (e.g., `microipfs-app`).
    *   Choose a license (e.g., `MIT`).
    *   Select "Docker" as the "Space SDK".
    *   Choose "Blank" as the Docker template.
    *   Under "Space hardware," select a CPU instance (the free tier is fine to start).
    *   Decide whether you want the Space to be public or private.
    *   Click "Create Space".
2.  **Configure the Space:**
    *   In your newly created Space, navigate to the "Files" tab.
    *   Click "Add file" -> "Upload file" and upload the `Dockerfile` from your local machine.
    *   Hugging Face will automatically detect the `Dockerfile` and start building your application. You can monitor the build process in the "Logs" tab.
3.  **Manage Secrets:**
    *   Navigate to the "Settings" tab in your Space.
    *   Scroll down to the "Secrets" section.
    *   Click "New secret".
    *   For the "Name," enter `NFT_STORAGE_KEY`.
    *   For the "Value," paste your API key from nft.storage.
    *   Click "Save". This will securely store your API key and make it available to your application as an environment variable.
4.  **Configure Persistent Storage:**
    *   The `keys.json` file, which contains the server's signing keys, needs to be persisted across restarts.
    *   Navigate to the "Settings" tab.
    *   Under "Hardware," upgrade to a paid tier to enable persistent storage (the "Small" tier is sufficient).
    *   This will mount a persistent volume at `/data`.
    *   **Important:** You will need to modify `index.js` to store the `keys.json` file in this directory. Change the `KEY_FILE` constant to:
        ```javascript
        const KEY_FILE = '/data/keys.json';
        ```
    *   After making this change, commit and push it to your Hugging Face code repository. The Space will automatically rebuild and use the new path.

## Part 3: Accessing Your Application

Once the build is complete and the server is running, you can access your application at the URL provided in the "App" tab of your Space (e.g., `https://your-username-microipfs-app.hf.space`).

You now have a fully functional and publicly accessible version of the `microipfs` application running on the Hugging Face Hub.
