class CameraInitiator {
  constructor({ cameraElement, canvasElement, capturedImageElement }) {
    this._cameraElement = cameraElement;
    this._canvasElement = canvasElement;
    this._capturedImageElement = capturedImageElement;
    this._stream = null;
  }

  async init() {
    try {
      this._stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
      });

      this._cameraElement.srcObject = this._stream;
    } catch (error) {
      console.error("Error accessing camera:", error);
      return { error: true, message: "Tidak dapat mengakses kamera" };
    }

    return { error: false };
  }

  captureImage() {
    const context = this._canvasElement.getContext("2d");

    this._canvasElement.width = this._cameraElement.videoWidth;
    this._canvasElement.height = this._cameraElement.videoHeight;

    context.drawImage(
      this._cameraElement,
      0,
      0,
      this._canvasElement.width,
      this._canvasElement.height
    );

    const imageBase64 = this._canvasElement
      .toDataURL("image/jpeg")
      .split(",")[1];

    this._capturedImageElement.src =
      this._canvasElement.toDataURL("image/jpeg");
    this._capturedImageElement.style.display = "block";
    this._cameraElement.style.display = "none";

    this.stopStream();

    return imageBase64;
  }

  resumeCamera() {
    if (this._stream) {
      this._capturedImageElement.style.display = "none";
      this._cameraElement.style.display = "block";
    } else {
      this.init();
    }
  }

  stopStream() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => {
        track.stop();
      });
      this._stream = null;
    }
  }

  get imageCapture() {
    return this._capturedImageElement.src;
  }
}

export default CameraInitiator;
