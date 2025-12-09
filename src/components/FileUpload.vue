<template>
  <div>
    <!-- File Upload Area -->
    <q-card flat class="upload-area q-mb-md" :class="isDragging ? 'dragging' : ''">
      <q-card-section
        class="q-pa-lg text-center cursor-pointer"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <q-icon name="cloud_upload" size="48px" color="primary" />
        <div class="text-h6 q-mt-md">Drop files here</div>
        <div class="text-caption text-grey-6">or click to select</div>

        <input
          ref="fileInput"
          type="file"
          multiple
          style="display: none"
          @change="handleFileSelect"
        />

        <q-btn
          color="primary"
          label="Select Files"
          @click="$refs.fileInput.click()"
          class="q-mt-md"
        />
      </q-card-section>

      <!-- Upload Progress -->
      <div v-if="uploadingFiles.length" class="q-pa-md border-top">
        <div v-for="file in uploadingFiles" :key="file.name" class="q-mb-md">
          <div class="row items-center justify-between q-mb-xs">
            <span class="text-body2">{{ file.name }}</span>
            <span class="text-caption text-grey-6">{{ file.progress }}%</span>
          </div>
          <q-linear-progress
            :value="file.progress / 100"
            color="primary"
            class="q-mb-xs"
          />
          <div class="text-caption text-grey-6">
            {{ formatFileSize(file.uploaded) }} / {{ formatFileSize(file.total) }}
          </div>
        </div>
      </div>
    </q-card>

    <!-- Uploaded Files Preview -->
    <div v-if="selectedFiles.length" class="q-mb-md">
      <div class="text-h6 q-mb-md">Selected Files ({{ selectedFiles.length }})</div>
      <div class="row q-gutter-md flex-wrap">
        <div v-for="file in selectedFiles" :key="file.name" class="file-preview">
          <q-card flat class="q-pa-md bg-grey-8">
            <q-img
              v-if="isImageFile(file.type)"
              :src="getFilePreview(file)"
              style="max-height: 150px; max-width: 150px"
            />
            <q-icon
              v-else
              name="attachment"
              size="60px"
              color="grey-6"
            />
            <div class="text-caption text-center text-white q-mt-sm truncate">
              {{ file.name }}
            </div>
            <div class="text-caption text-grey-6 text-center">
              {{ formatFileSize(file.size) }}
            </div>
            <q-btn
              flat
              dense
              round
              icon="close"
              size="sm"
              color="negative"
              @click="removeFile(file.name)"
              class="absolute-top-right"
            />
          </q-card>
        </div>
      </div>

      <q-btn
        color="primary"
        label="Upload Files"
        @click="uploadFiles"
        :loading="isUploading"
        class="q-mt-md"
      />
      <q-btn
        flat
        label="Clear"
        @click="clearFiles"
        class="q-ml-md"
      />
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue'
import { useQuasar } from 'quasar'
import axios from 'axios'

export default defineComponent({
  name: 'FileUpload',
  props: {
    messageId: {
      type: Number,
      required: true
    }
  },
  emits: ['upload-complete'],
  setup() {
    const $q = useQuasar()

    return {
      $q,
      isDragging: false,
      selectedFiles: [],
      uploadingFiles: [],
      isUploading: false,
      fileInput: null
    }
  },
  methods: {
    handleDrop(event) {
      this.isDragging = false
      const files = Array.from(event.dataTransfer.files)
      this.selectedFiles.push(...files)
    },
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      this.selectedFiles.push(...files)
    },
    removeFile(fileName) {
      this.selectedFiles = this.selectedFiles.filter(f => f.name !== fileName)
    },
    clearFiles() {
      this.selectedFiles = []
    },
    isImageFile(mimeType) {
      return mimeType?.startsWith('image/')
    },
    getFilePreview(file) {
      return URL.createObjectURL(file)
    },
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    },
    async uploadFiles() {
      if (!this.selectedFiles.length) {
        this.$q.notify({
          type: 'warning',
          message: 'No files selected'
        })
        return
      }

      this.isUploading = true
      const uploadPromises = this.selectedFiles.map(file => this.uploadFile(file))

      try {
        await Promise.all(uploadPromises)
        this.$q.notify({
          type: 'positive',
          message: `${this.selectedFiles.length} file(s) uploaded successfully`
        })
        this.$emit('upload-complete')
        this.clearFiles()
      } catch {
        this.$q.notify({
          type: 'negative',
          message: 'Failed to upload files'
        })
      } finally {
        this.isUploading = false
        this.uploadingFiles = []
      }
    },
    async uploadFile(file) {
      const formData = new FormData()
      formData.append('file', file)

      const uploadFile = {
        name: file.name,
        total: file.size,
        uploaded: 0,
        progress: 0
      }
      this.uploadingFiles.push(uploadFile)

      try {
        await axios.post(
          `/messages/${this.messageId}/files`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              uploadFile.uploaded = progressEvent.loaded
              uploadFile.progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            }
          }
        )
      } catch (error) {
        console.error('Upload error:', error)
        throw error
      }
    }
  }
})
</script>

<style scoped>
.upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  transition: all 0.3s;
}

.upload-area.dragging {
  border-color: #1976d2;
  background-color: rgba(25, 118, 210, 0.1);
}

.file-preview {
  position: relative;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
}

.border-top {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
</style>
