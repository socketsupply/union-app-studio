import fs from 'socket:fs'

self.addEventListener('message', async event => {
  const files = event.data.files

  for (const file of files) {
    try {
      const formData = new FormData()

      Object.entries(file.fields).forEach(([key, value]) => {
        formData.append(key, value)
      })

      formData.append('file', await fs.readFile(file.path))

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }
    } catch (error) {
      return self.postMessage({
        status: 'error',
        message: `Error uploading ${file.name}: ${error.message}`
      })
    }
  }

  self.postMessage({
    status: 'success',
    message: 'All files uploaded successfully!'
  })
})
