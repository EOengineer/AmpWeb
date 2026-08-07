import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "deviceSelect",
    "channelSelect",
    "toggleButton",
    "monitorToggle",
    "meterFill",
    "status",
    "jewel"
  ]

  static values = {
    running: { type: Boolean, default: false }
  }

  connect() {
    this.audioContext = null
    this.mediaStream = null
    this.sourceNode = null
    this.splitterNode = null
    this.channelGain = null
    this.analyser = null
    this.monitorGain = null
    this.selectedChannel = 0
    this.rafId = null
    this.deviceChangeHandler = () => this.refreshDevices()

    if (navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener("devicechange", this.deviceChangeHandler)
    }

    this.refreshDevices()
    this.updateUi()
  }

  disconnect() {
    if (navigator.mediaDevices) {
      navigator.mediaDevices.removeEventListener("devicechange", this.deviceChangeHandler)
    }
    this.stopCapture()
  }

  runningValueChanged() {
    this.updateUi()
  }

  async toggle() {
    if (this.runningValue) {
      this.stopCapture()
    } else {
      await this.startCapture()
    }
  }

  async deviceChanged() {
    if (!this.runningValue) return
    await this.startCapture()
  }

  channelChanged() {
    const value = parseInt(this.channelSelectTarget.value, 10)
    this.selectedChannel = Number.isFinite(value) ? value : 0
    this.reconnectChannel()
  }

  monitorChanged() {
    if (!this.monitorGain) return
    this.monitorGain.gain.value = this.monitorToggleTarget.checked ? 1 : 0
  }

  async refreshDevices() {
    if (!navigator.mediaDevices?.enumerateDevices) {
      this.setStatus("Media devices API not available in this browser")
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const inputs = devices.filter((d) => d.kind === "audioinput")
      const previous = this.deviceSelectTarget.value

      this.deviceSelectTarget.innerHTML = ""

      if (inputs.length === 0) {
        const option = document.createElement("option")
        option.value = ""
        option.textContent = "No input devices found"
        this.deviceSelectTarget.appendChild(option)
        this.setStatus("No audio input devices found")
        return
      }

      const missingLabels = inputs.every((d) => !d.label)
      if (missingLabels) {
        const option = document.createElement("option")
        option.value = ""
        option.textContent = "Allow microphone access to list devices"
        this.deviceSelectTarget.appendChild(option)
        this.setStatus("Click Start to grant microphone permission")
        return
      }

      inputs.forEach((device, index) => {
        const option = document.createElement("option")
        option.value = device.deviceId
        option.textContent = device.label || `Input ${index + 1}`
        this.deviceSelectTarget.appendChild(option)
      })

      if (previous && inputs.some((d) => d.deviceId === previous)) {
        this.deviceSelectTarget.value = previous
      }
    } catch (error) {
      this.setStatus(`Could not list devices: ${error.message}`)
    }
  }

  async startCapture() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.setStatus("getUserMedia is not supported in this browser")
      return
    }

    try {
      this.stopGraph(false)

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: { ideal: 2 }
        },
        video: false
      }

      const deviceId = this.deviceSelectTarget.value
      if (deviceId) {
        constraints.audio.deviceId = { exact: deviceId }
      }

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      await this.refreshDevices()

      if (deviceId) {
        this.deviceSelectTarget.value = deviceId
      } else {
        const track = this.mediaStream.getAudioTracks()[0]
        const settings = track?.getSettings?.() || {}
        if (settings.deviceId) {
          this.deviceSelectTarget.value = settings.deviceId
        }
      }

      this.audioContext = new AudioContext({ latencyHint: "interactive" })
      if (this.audioContext.state === "suspended") {
        await this.audioContext.resume()
      }

      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream)
      const track = this.mediaStream.getAudioTracks()[0]
      const settings = track.getSettings()
      const channelCount = Math.max(1, settings.channelCount || this.sourceNode.channelCount || 1)

      this.populateChannels(channelCount)

      this.splitterNode = this.audioContext.createChannelSplitter(Math.max(channelCount, 2))
      this.channelGain = this.audioContext.createGain()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.monitorGain = this.audioContext.createGain()
      this.monitorGain.gain.value = this.monitorToggleTarget.checked ? 1 : 0

      this.sourceNode.connect(this.splitterNode)
      this.reconnectChannel()
      this.channelGain.connect(this.analyser)
      this.analyser.connect(this.monitorGain)
      this.monitorGain.connect(this.audioContext.destination)

      this.runningValue = true
      this.startMeter()
      this.setStatus(this.latencyStatus(settings, channelCount))
    } catch (error) {
      this.stopCapture()
      this.setStatus(this.friendlyError(error))
    }
  }

  stopCapture() {
    this.stopGraph(true)
    this.runningValue = false
    this.setStatus("Idle — choose a device and press Start")
    if (this.hasMeterFillTarget) {
      this.meterFillTarget.style.width = "0%"
    }
  }

  stopGraph(resetChannels) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }

    this.sourceNode = null
    this.splitterNode = null
    this.channelGain = null
    this.analyser = null
    this.monitorGain = null

    if (resetChannels && this.hasChannelSelectTarget) {
      this.channelSelectTarget.innerHTML = ""
      const option = document.createElement("option")
      option.value = ""
      option.textContent = "—"
      this.channelSelectTarget.appendChild(option)
      this.channelSelectTarget.disabled = true
    }
  }

  populateChannels(channelCount) {
    this.channelSelectTarget.innerHTML = ""
    for (let i = 0; i < channelCount; i += 1) {
      const option = document.createElement("option")
      option.value = String(i)
      option.textContent = `Channel ${i + 1}`
      this.channelSelectTarget.appendChild(option)
    }
    this.channelSelectTarget.disabled = false

    if (this.selectedChannel >= channelCount) {
      this.selectedChannel = 0
    }
    this.channelSelectTarget.value = String(this.selectedChannel)
  }

  reconnectChannel() {
    if (!this.splitterNode || !this.channelGain) return

    try {
      this.splitterNode.disconnect()
    } catch (_error) {
      // nothing connected yet
    }

    this.splitterNode.connect(this.channelGain, this.selectedChannel)
  }

  startMeter() {
    if (!this.analyser) return

    const data = new Uint8Array(this.analyser.frequencyBinCount)

    const tick = () => {
      if (!this.analyser) return
      this.analyser.getByteTimeDomainData(data)

      let sum = 0
      for (let i = 0; i < data.length; i += 1) {
        const centered = (data[i] - 128) / 128
        sum += centered * centered
      }
      const rms = Math.sqrt(sum / data.length)
      const percent = Math.min(100, Math.round(rms * 140))
      this.meterFillTarget.style.width = `${percent}%`

      this.rafId = requestAnimationFrame(tick)
    }

    this.rafId = requestAnimationFrame(tick)
  }

  latencyStatus(settings, channelCount) {
    const sampleRate = this.audioContext?.sampleRate || settings.sampleRate || "—"
    const baseMs = this.audioContext?.baseLatency != null
      ? (this.audioContext.baseLatency * 1000).toFixed(1)
      : "—"
    const outputMs = this.audioContext?.outputLatency != null
      ? (this.audioContext.outputLatency * 1000).toFixed(1)
      : "—"

    return `Live · ${channelCount} ch · ${sampleRate} Hz · base ${baseMs} ms · output ${outputMs} ms`
  }

  friendlyError(error) {
    if (error?.name === "NotAllowedError") {
      return "Microphone permission denied — allow access and try again"
    }
    if (error?.name === "NotFoundError") {
      return "No matching input device found"
    }
    if (error?.name === "OverconstrainedError") {
      return "Selected device constraints not supported — try another device"
    }
    return `Could not open input: ${error.message || error}`
  }

  setStatus(message) {
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
    }
  }

  updateUi() {
    if (this.hasToggleButtonTarget) {
      this.toggleButtonTarget.textContent = this.runningValue ? "Stop" : "Start"
      this.toggleButtonTarget.dataset.running = this.runningValue ? "true" : "false"
    }
    if (this.hasJewelTarget) {
      this.jewelTarget.dataset.live = this.runningValue ? "true" : "false"
    }
  }
}
