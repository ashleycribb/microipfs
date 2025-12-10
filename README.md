# microipfs

> dead simple microservice for pinning NFT related data to IPFS

Microipfs is a microservice for adding NFT related data (NFT asset files, metadata json, etc.) to IPFS using [nft.storage](https://nft.storage)

# install

## 1. Install Microipfs

Clone the repo

```
git clone 
```

Install dependencies

```
npm install
```


## 2. Connect with NFT.STORAGE

create an `.env` file inside the microipfs folder and,

- enter `NFT_STORAGE_KEY`: The NFT STORAGE API KEY
- (optional) enter `ALLOWED`: A comma separated string of host HTTP URLs
- (optional) enter `PORT`: The port to run the server from

Example

```
NFT_STORAGE_KEY=<eyJhbCg.....
WHITELIST=https://myapp.com,http://localhost:8080
PORT=3000
```

## 3. Start the server

Start the server

```
npm start
```

# usage

1. pin JSON
2. pin web content

## 1. pin JSON

Pinning a JSON object (NFT metadata) is easy. Simply make a POST request to microipfs:

```
POST /add
HOST: microipfs.com
Content-Type:application/json
Accept:application/json

{
  "name": "my nft",
  "description": "this is my first nft",
  "image": "ipfs://ipfs/....",
}
```

Anything that can be accessed via HTTP can be pinned. Microipfs automatically fetches the URL and pins it to IPFS using NFT.STORAGE

## 2. pin web content

Anything that can be accessed via HTTP can be pinned. Microipfs automatically fetches the URL and pins it to IPFS using NFT.STORAGE

## 3. pin learning object

You can pin a learning object, which consists of multiple files and rich metadata. This is useful for creating a permanent, verifiable archive of educational resources. To do this, make a POST request to `/add-learning-object` with the files and metadata included as `multipart/form-data`.

The response will be a JSON object containing the CID of a manifest file. The manifest file is a JSON object that contains all the metadata and a list of the files in the learning object, along with their individual CIDs.

**Metadata Fields:**

*   `title` (string): The title of the learning object.
*   `author` (string): The author or creator.
*   `subject` (string): The subject matter.
*   `gradeLevel` (string): The target grade level (e.g., "9-12").
*   `license` (string): The content license (e.g., "CC-BY-4.0").
*   `description` (string): A brief description of the content.

Example using `curl`:

```bash
curl -X POST \
  -F "files=@/path/to/lesson-plan.pdf" \
  -F "files=@/path/to/presentation.pptx" \
  -F "title=Introduction to Photosynthesis" \
  -F "author=Jane Doe" \
  -F "subject=Biology" \
  -F "gradeLevel=9-12" \
  -F "license=CC-BY-SA-4.0" \
  -F "description=A comprehensive introduction to the process of photosynthesis." \
  http://localhost:3000/add-learning-object
```

## 4. pin encrypted object (for student portfolios)

For sensitive data like student work, the application supports client-side encryption. The encryption and decryption happen entirely in the user's browser, and the server only ever handles the encrypted data. This ensures student privacy.

The reference implementation for this workflow can be found at `/portfolio.html`.

An endpoint at `POST /add-encrypted-object` is available to receive the encrypted file blob.

## 5. check CID status

You can check the status of a pinned CID by making a GET request to `/status/:cid`.

Example using `curl`:

```bash
curl http://localhost:3000/status/bafybe....
```

## 6. Interactive AI Model Playground

The application includes a tool at `/playground.html` for interacting with pre-trained AI models (specifically, TensorFlow.js Layers models) that have been pinned to IPFS.

To use it:
1.  Create a "Learning Object" that contains a TensorFlow.js `model.json` file and its associated binary weight files (`.bin`).
2.  Get the CID of the `model.json` file.
3.  Open the playground, enter the CID, and click "Load Model".
4.  Interact with the model (e.g., by drawing on the canvas for an image classification model).
