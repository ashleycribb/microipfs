require('dotenv').config()
var cors = require('cors')
var { I } = require('ipfsio')
var express = require('express')
var multer = require('multer')
const fs = require('fs')
const fsp = require('fs').promises
const axios = require('axios')
var app = express()
var i = new I(process.env.NFT_STORAGE_KEY)

const recentUploads = []
const MAX_RECENT_UPLOADS = 10

const UPLOAD_DIR = 'uploads/'
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR)
}

const allowed = (process.env.ALLOWED ? process.env.ALLOWED.split(",") : [])
const port = (process.env.PORT ? process.env.PORT : 3000)
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

app.post('/add-dataset', upload.array('files'), async (req, res) => {
  const files = req.files
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' })
  }

  const { name, description } = req.body

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
      name: name || 'Untitled Dataset',
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
