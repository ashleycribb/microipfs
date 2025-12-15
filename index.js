require('dotenv').config()
var cors = require('cors')
var { I } = require('ipfsio')
var express = require('express')
var multer = require('multer')
const fs = require('fs')
const fsp = require('fs').promises
const { randomUUID } = require('crypto');
const axios = require('axios')
const jose = require('jose')
var app = express()
var i = new I(process.env.NFT_STORAGE_KEY)

let institutionKeyPair;
const KEY_FILE = 'keys.json';

async function initializeKeys() {
  try {
    if (fs.existsSync(KEY_FILE)) {
      const keyFileContent = await fsp.readFile(KEY_FILE, 'utf-8');
      const jwk = JSON.parse(keyFileContent);
      institutionKeyPair = {
        publicKey: await jose.importJWK(jwk.publicKey, 'ES256'),
        privateKey: await jose.importJWK(jwk.privateKey, 'ES256'),
      };
      console.log('Loaded institutional key pair from file.');
    } else {
      const { publicKey, privateKey } = await jose.generateKeyPair('ES256');
      institutionKeyPair = { publicKey, privateKey };
      const jwk = {
        publicKey: await jose.exportJWK(publicKey),
        privateKey: await jose.exportJWK(privateKey),
      };
      await fsp.writeFile(KEY_FILE, JSON.stringify(jwk, null, 2));
      console.log('Generated new institutional key pair and saved to file.');
    }
  } catch (error) {
    console.error('Failed to initialize keys:', error);
  }
}

initializeKeys();

const recentUploads = []
const MAX_RECENT_UPLOADS = 10

const UPLOAD_DIR = 'uploads/'
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR)
}

const allowed = (process.env.ALLOWED ? process.env.ALLOWED.split(",") : [])
const port = (process.env.PORT ? process.env.PORT : 3000)
const issuerDid = process.env.ISSUER_DID || 'did:web:example.com';
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
    files: 10
  }
})
app.use(express.json())
app.use(express.static('public'))
if (allowed && allowed.length > 0) {
  app.use(cors({ origin: allowed }))
} else {
  app.use(cors())
}
app.use(express.urlencoded({ extended: true }));
app.post('/add', async (req, res) => {
  let cid;
  if (req.body.url) {
    cid = await i.url(req.body.url)
  } else if (req.body.object) {
    cid = await i.object(req.body.object)
  }
  console.log("cid", cid)
  res.json({ success: cid })
})
app.get('/.well-known/jwks.json', async (req, res) => {
  if (!institutionKeyPair || !institutionKeyPair.publicKey) {
    return res.status(500).json({ error: 'Key pair not generated yet.' });
  }
  const jwk = await jose.exportJWK(institutionKeyPair.publicKey);
  res.json({ keys: [jwk] });
});

app.post('/issue-credential', async (req, res) => {
  if (!institutionKeyPair || !institutionKeyPair.privateKey) {
    return res.status(500).json({ error: 'Key pair not generated yet.' });
  }

  const { studentDid, proofOfWorkCID, claims } = req.body;
  if (!studentDid || !claims) {
    return res.status(400).json({ error: 'Missing studentDid or claims.' });
  }

  try {
    const vcPayload = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: `urn:uuid:${randomUUID()}`,
      type: ['VerifiableCredential', 'AcademicCredential'],
      issuer: issuerDid,
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: studentDid,
        proofOfWorkCID: proofOfWorkCID,
        ...claims
      }
    };

    const jwt = await new jose.SignJWT(vcPayload)
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuedAt()
       .setIssuer(issuerDid)
      .setSubject(studentDid)
      .sign(institutionKeyPair.privateKey);

    res.json({ vcJwt: jwt });
  } catch (error) {
    console.error('Failed to issue credential:', error);
    res.status(500).json({ error: 'Failed to issue credential.' });
  }
});
app.post('/batch-archive', async (req, res) => {
  const { items } = req.body; // Expects an array of objects with { url, metadata }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty "items" array in request body.' });
  }

  try {
    const processingPromises = items.map(async (item) => {
      const cid = await i.url(item.url);
      return { cid, metadata: item.metadata };
    });

    const processedItems = await Promise.all(processingPromises);

    const manifest = {
      archiveDate: new Date().toISOString(),
      items: processedItems,
    };

    const manifestCid = await i.object(manifest);
    res.json({ success: true, manifestCid });

  } catch (error) {
    console.error('Batch archive failed:', error);
    res.status(500).json({ error: 'Failed to process batch archive.' });
  }
});
app.get('/recent', (req, res) => {
  res.json(recentUploads)
})

app.get('/status/:cid', async (req, res) => {
  const { cid } = req.params
  try {
    const response = await axios.get(`https://api.nft.storage/check/${cid}`, {
      headers: {
        'Authorization': `Bearer ${process.env.NFT_STORAGE_KEY}`
      }
    })
    res.json(response.data)
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({ error: error.response.data })
    } else {
      res.status(500).json({ error: 'Failed to check CID status' })
    }
  }
})

app.post('/add-encrypted-object', upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  try {
    const cid = await i.path(file.path)
    res.json({ success: cid })
  } catch (error) {
    console.error('Failed to pin encrypted object:', error)
    res.status(500).json({ error: 'Failed to pin encrypted object' })
  } finally {
    // Clean up the temporary file
    await fsp.unlink(file.path)
  }
})

app.post('/add-learning-object', upload.array('files'), async (req, res) => {
  const files = req.files
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }

  const { title, author, subject, gradeLevel, license, description } = req.body

  try {
    const cids = []
    for (const file of files) {
      const cid = await i.path(file.path)
      cids.push({
        filename: file.originalname,
        cid: cid
      })
    }

    const manifest = {
      title: title || 'Untitled Learning Object',
      author: author || 'Unknown',
      subject: subject || 'Uncategorized',
      gradeLevel: gradeLevel || 'N/A',
      license: license || 'CC-BY-4.0',
      description: description || '',
      files: cids
    }

    const manifestCid = await i.object(manifest)

    recentUploads.unshift(manifestCid)
    if (recentUploads.length > MAX_RECENT_UPLOADS) {
      recentUploads.pop()
    }

    res.json({ success: manifestCid })
  } catch (error) {
    console.error('Failed to process dataset:', error)
    res.status(500).json({ error: 'Failed to process dataset' })
  } finally {
    const unlinkPromises = files.map(file => fsp.unlink(file.path))
    await Promise.all(unlinkPromises)
  }
})
app.listen(port)
