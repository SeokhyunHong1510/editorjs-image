import {
  IconPicture,
  IconAlignLeft,
  IconAlignRight,
  IconAlignCenter,
  IconUndo,
  IconMarker,
  IconChecklist,
} from "@codexteam/icons";
import { make } from "./utils/dom";

/**
 * Class for working with UI:
 *  - rendering base structure
 *  - show/hide preview
 *  - apply tune view
 */
export default class Ui {
  /**
   * @param {object} ui - image tool Ui module
   * @param {object} ui.api - Editor.js API
   * @param {ImageConfig} ui.config - user config
   * @param {Function} ui.onSelectFile - callback for clicks on Select file button
   * @param {boolean} ui.readOnly - read-only mode flag
   */
  constructor({ api, config, onSelectFile, readOnly }) {
    this.api = api;
    this.config = config;
    this.onSelectFile = onSelectFile;
    this.readOnly = readOnly;
    this.nodes = {
      wrapper: make("div", [this.CSS.baseClass, this.CSS.wrapper]),
      imageContainer: make("div", [this.CSS.imageContainer]),
      toolBarContainer: make("div", this.CSS.toolBarContainer),
      alignButtonsWrapper: make("div", this.CSS.alignButtonsWrapper),
      leftAlign: this.createLeftAlignButton(),
      centerAlign: this.createCenterAlignButton(),
      rightAlign: this.createRightAlignButton(),
      resizeFormWrapper: make("div", this.CSS.resizeFormWrapper),
      resizeForm: make("form", [this.CSS.resizeForm]),
      inputWidth: make(
        "input",
        [this.CSS.input, this.CSS.caption, this.CSS.setImage],
        {
          contentEditable: !this.readOnly,
        }
      ),
      inputHeight: make(
        "input",
        [this.CSS.input, this.CSS.caption, this.CSS.setImage],
        {
          contentEditable: !this.readOnly,
        }
      ),

      setSizeButton: this.createSetSizeButton(),
      resetSizeButton: this.createResetSizeButton(),
      resizeModeWrapper: make("div", this.CSS.resizeModeWrapper),
      resizeModeButton: this.createResizeModeButton(),
      exitResizeModeButton: this.createExitResizeModeButton(),
      undoResizeButton: this.createUndoResizeButton(),
      fileButton: this.createFileButton(),
      imageEl: undefined,
      imagePreloader: make("div", this.CSS.imagePreloader),
      caption: make("div", [this.CSS.input, this.CSS.caption], {
        contentEditable: !this.readOnly,
      }),
    };
    this.konva = {};

    this.nodes.inputWidth.value = this.config.width;
    this.nodes.inputWidth.addEventListener("keydown", (e) => {
      if (e.keyCode === 13) {
        this.onSetImageSize();
      }
    });

    this.nodes.inputHeight.value = this.config.height;
    this.nodes.inputHeight.addEventListener("keydown", (e) => {
      if (e.keyCode === 13) {
        this.onSetImageSize();
      }
    });

    /**
     * Create base structure
     *  <wrapper>
     *    <image-container>
     *      <image-preloader />
     *    </image-container>
     *
     *    <toolBarContainer>
     *       <alignButtonsWrapper>
     *       </alignButtonsWrapper>
     *       <resizeFormWrapper >
     *       </resizeFormWrapper>
     *       <resizeModeWrapper>
     *       </resizeModeWrapper>
     *    </toolBarContainer>
     *
     *    <caption />
     *    <select-file-button />
     *  </wrapper>
     */

    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.imageContainer.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    this.nodes.wrapper.appendChild(this.nodes.toolBarContainer);

    this.nodes.toolBarContainer.appendChild(this.nodes.alignButtonsWrapper);
    this.nodes.alignButtonsWrapper.appendChild(this.nodes.leftAlign);
    this.nodes.alignButtonsWrapper.appendChild(this.nodes.centerAlign);
    this.nodes.alignButtonsWrapper.appendChild(this.nodes.rightAlign);

    this.nodes.toolBarContainer.appendChild(this.nodes.resizeFormWrapper);
    this.nodes.resizeForm.appendChild(this.nodes.inputWidth);
    this.nodes.resizeForm.appendChild(this.nodes.inputHeight);
    this.nodes.resizeForm.appendChild(this.nodes.setSizeButton);
    this.nodes.resizeForm.appendChild(this.nodes.resetSizeButton);
    this.nodes.resizeForm.addEventListener("submit", (e) => {
      e.preventDefault();
    });

    this.nodes.toolBarContainer.appendChild(this.nodes.resizeModeWrapper);
    this.nodes.resizeFormWrapper.appendChild(this.nodes.resizeForm);
    this.nodes.resizeModeWrapper.appendChild(this.nodes.resizeModeButton);
    this.nodes.resizeModeWrapper.appendChild(this.nodes.undoResizeButton);
    this.nodes.resizeModeWrapper.appendChild(this.nodes.exitResizeModeButton);

    this.nodes.wrapper.appendChild(this.nodes.caption);
    this.nodes.wrapper.appendChild(this.nodes.fileButton);
  }

  /**
   * CSS classes
   *
   * @returns {object}
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      button: this.api.styles.button,
      form: this.api.styles.form,

      /**
       * Tool's classes
       */

      wrapper: "image-tool",
      imageContainer: "image-tool__image",
      imagePreloader: "image-tool__image-preloader",
      imageEl: "image-tool__image-picture",
      caption: "image-tool__caption",
      setImage: "image-tool__setImage",
      toolBarContainer: "image-tool__toolBar",

      alignButtonsWrapper: "image-tool__toolBar__alignButtonsWrapper",
      alignButton: "image-tool__toolBar__alignButtonsWrapper-alignButton",
      leftAlign: "image-tool__toolBar__alignButtonsWrapper-leftAlign",
      centerAlign: "image-tool__toolBar__alignButtonsWrapper-centerAlign",
      rightAlign: "image-tool__toolBar__alignButtonsWrapper-rightAlign",

      resizeFormWrapper: "image-tool__toolBar__resizeFormWrapper",
      resizeForm: "image-tool__toolBar__resizeFormWrapper-resizeForm",
      setSizeButton: "image-tool__toolBar__resizeFormWrapper-setSizeButton",
      resetSizeButton: "image-tool__toolBar__resizeFormWrapper-resetSizeButton",

      resizeModeWrapper: "image-tool__toolBar__resizeModeWrapper",
      resizeModeButton:
        "image-tool__toolBar__resizeModeWrapper-resizeModeButton",
      exitResizeModeButton:
        "image-tool__toolBar__resizeModeWrapper-exitResizeModeButton",
      undoResizeButton:
        "image-tool__toolBar__resizeModeWrapper-undoResizeButton",
    };
  }

  /**
   * Ui statuses:
   * - empty
   * - uploading
   * - filled
   *
   * @returns {{EMPTY: string, UPLOADING: string, FILLED: string}}
   */
  static get status() {
    return {
      EMPTY: "empty",
      UPLOADING: "loading",
      FILLED: "filled",
    };
  }

  /**
   * Renders tool UI
   *
   * @param {ImageToolData} toolData - saved tool data
   * @returns {Element}
   */
  render(toolData) {
    if (!toolData.file || Object.keys(toolData.file).length === 0) {
      this.nodes.toolBarContainer.style.display = "none";
      this.toggleStatus(Ui.status.EMPTY);
    } else {
      this.toggleStatus(Ui.status.UPLOADING);
    }

    return this.nodes.wrapper;
  }

  /**
   * Creates upload-file button
   *
   * @returns {Element}
   */
  createFileButton() {
    const button = make("div", [this.CSS.button]);

    button.innerHTML =
      this.config.buttonContent ||
      `${IconPicture} ${this.api.i18n.t("Select an Image")}`;

    button.addEventListener("click", () => {
      this.onSelectFile();
    });

    return button;
  }

  /**
   * Shows uploading preloader
   *
   * @param {string} src - preview source
   * @returns {void}
   */
  showPreloader(src) {
    this.nodes.imagePreloader.style.backgroundImage = `url(${src})`;

    this.toggleStatus(Ui.status.UPLOADING);
  }

  /**
   * Hide uploading preloader
   *
   * @returns {void}
   */
  hidePreloader() {
    this.nodes.imagePreloader.style.backgroundImage = "";
    this.toggleStatus(Ui.status.EMPTY);
  }

  /**
   * Shows an image
   *
   * @param {string} url - image source
   * @returns {void}
   */
  fillImage(url) {
    /**
     * Check for a source extension to compose element correctly: video tag for mp4, img — for others
     */
    const tag = /\.mp4$/.test(url) ? "VIDEO" : "IMG";

    const attributes = {
      src: url,
    };

    /**
     * We use eventName variable because IMG and VIDEO tags have different event to be called on source load
     * - IMG: load
     * - VIDEO: loadeddata
     *
     * @type {string}
     */
    let eventName = "load";

    /**
     * Update attributes and eventName if source is a mp4 video
     */
    if (tag === "VIDEO") {
      /**
       * Add attributes for playing muted mp4 as a gif
       *
       * @type {boolean}
       */
      attributes.autoplay = true;
      attributes.loop = true;
      attributes.muted = true;
      attributes.playsinline = true;

      /**
       * Change event to be listened
       *
       * @type {string}
       */
      eventName = "loadeddata";
    }

    /**
     * Compose tag with defined attributes
     *
     * @type {Element}
     */
    this.nodes.imageEl = make(tag, this.CSS.imageEl, attributes);
    this.nodes.toolBarContainer.style.display = "";
    this.nodes.imageEl.style.width = this.config.width;
    this.nodes.imageEl.style.height = this.config.height;
    this.config.originWidth = this.nodes.imageEl.naturalWidth;
    this.config.originHeight = this.nodes.imageEl.naturalHeight;

    /**
     * Add load event listener
     */
    this.nodes.imageEl.addEventListener(eventName, () => {
      this.toggleStatus(Ui.status.FILLED);

      /**
       * Preloader does not exists on first rendering with presaved data
       */
      if (this.nodes.imagePreloader) {
        this.nodes.imagePreloader.style.backgroundImage = "";
      }
    });

    this.nodes.imageContainer.appendChild(this.nodes.imageEl);
    this.nodes.fileButton.style.display = "none";
  }

  /**
   * Make the image resizable
   *
   * @param {object} imageEl - image element
   */

  /**
   * Create align left set button
   *
   * @returns {Element}
   */
  createLeftAlignButton() {
    const button = make("button", [this.CSS.leftAlign, this.CSS.alignButton]);

    button.innerHTML = `${IconAlignLeft}`;
    button.addEventListener("click", () => {
      this.onSelectAlign("left");
    });

    return button;
  }

  /**
   * Create align center set button
   *
   * @returns {Element}
   */
  createCenterAlignButton() {
    const button = make("button", [this.CSS.centerAlign, this.CSS.alignButton]);

    button.innerHTML = `${IconAlignCenter}`;
    button.addEventListener("click", () => {
      this.onSelectAlign("center");
    });

    return button;
  }

  /**
   * Create align right set button
   *
   * @returns {Element}
   */
  createRightAlignButton() {
    const button = make("button", [this.CSS.rightAlign, this.CSS.alignButton]);

    button.innerHTML = `${IconAlignRight}`;
    button.addEventListener("click", () => {
      this.onSelectAlign("right");
    });

    return button;
  }

  /**
   *
   * @returns {boolean}
   */
  isToggle(align) {
    return !align;
  }

  /**
   * Show preloader and upload image by target url
   *
   *
   * @returns {void}
   */
  onSelectAlign(align) {
    this.config.isSelectedLeft =
      align === "left" ? this.isToggle(this.config.isSelectedLeft) : false;
    this.config.isSelectedCenter =
      align === "center" ? this.isToggle(this.config.isSelectedCenter) : false;
    this.config.isSelectedRight =
      align === "right" ? this.isToggle(this.config.isSelectedRight) : false;
    this.applyTune("left", this.config.isSelectedLeft);
    this.applyTune("center", this.config.isSelectedCenter);
    this.applyTune("right", this.config.isSelectedRight);
    this.applyAlign();
  }

  createInputWidth() {
    const input = make(
      "input",
      [this.CSS.input, this.CSS.caption, this.CSS.setImage],
      {
        contentEditable: !this.readOnly,
      }
    );

    input.addEventListener("keydown", (e) => {
      if (e.keyCode === 13 && input.value !== "") {
        this.onSetImageSize();
      } else if (e.keyCode === 13 && input.value === "") {
        e.preventDefault();
      }
    });
    return input;
  }

  createInputHeight() {
    const input = make(
      "input",
      [this.CSS.input, this.CSS.caption, this.CSS.setImage],
      {
        contentEditable: !this.readOnly,
      }
    );

    input.addEventListener("keydown", (e) => {
      if (e.keyCode === 13 && input.value !== "") {
        this.onSetImageSize();
      } else if (e.keyCode === 13 && input.value === "") {
        e.preventDefault();
      }
    });

    this.nodes.inputHeight.placeholder = this.config.heightPlaceholder;

    return input;
  }

  makeImageResizable(imageEl) {
    var ceBlockContentNodes = document.querySelectorAll(".ce-block__content");
    if (ceBlockContentNodes.length > 0) {
      this.config.konvaWidth = ceBlockContentNodes[0].clientWidth;
    }

    var imgWidth = Number(this.nodes.inputWidth.value);
    var imgHeight = Number(this.nodes.inputHeight.value);

    var originWidth = this.config.originWidth;
    var originHeight = this.config.originHeight;

    var canvasWidth = this.config.konvaWidth;
    var canvasHeight = (originHeight / originWidth) * canvasWidth;
    var canvasHeightForInput = (imgHeight / imgWidth) * canvasWidth;

    var stage = new Konva.Stage({
      container: this.nodes.imageContainer,
      width: canvasWidth,
      height: canvasHeightForInput || canvasHeight,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    var konvaImageSize = {};

    if (originWidth < canvasWidth) {
      konvaImageSize.width = originWidth;
      konvaImageSize.height = originHeight;
    } else {
      konvaImageSize.width = canvasWidth;
      konvaImageSize.height = canvasWidth * (originHeight / originWidth);
    }
    var resizeImg = new Konva.Image({
      width: imgWidth || konvaImageSize.width,
      height: imgHeight || konvaImageSize.height,
      draggable: true,
    });

    resizeImg.image(imageEl);
    layer.add(resizeImg);

    var tr = new Konva.Transformer({
      rotateEnabled: false,
      enabledAnchors: [
        "top-center",
        "middle-right",
        "bottom-center",
        "middle-left",
        "top-left",
        "top-right",
        "bottom-left",
        "bottom-right",
      ],
      boundBoxFunc: function (oldBoundBox, newBoundBox) {
        if (
          Math.abs(newBoundBox.width) > canvasWidth ||
          Math.abs(newBoundBox.height) > canvasHeight
        ) {
          return oldBoundBox;
        }

        return newBoundBox;
      },
    });

    this.konva = {
      stage: stage,
      layer: layer,
      group: resizeImg,
      prevSize: { width: imgWidth, height: imgHeight },
    };

    layer.add(tr);
    tr.nodes([resizeImg]);
  }

  /**
   * Set image width and height value
   *
   * @returns {Void}
   */

  /**
   * get width value entered or cotrolled by user
   *
   * @returns {String}
   */
  get getImageWidth() {
    return this.nodes.imageEl.style.width;
  }

  /**
   * get height value entered or cotrolled by user
   *
   * @returns {String}
   */
  get getImageHeight() {
    return this.nodes.imageEl.style.height;
  }

  onSetImageSize() {
    let getWidthValue = Number(this.nodes.inputWidth.value);
    let getHeightValue = Number(this.nodes.inputHeight.value);
    const prevWidth = this.nodes.imageEl.style.width;
    const prevHeight = this.nodes.imageEl.style.height;

    if (!getWidthValue && !getHeightValue) {
      this.nodes.imageEl.style.width = "auto";
      this.nodes.imageEl.style.height = "auto";
      return;
    }

    this.nodes.imageEl.style.width = getWidthValue || prevWidth;
    this.nodes.imageEl.style.height = getHeightValue || prevHeight;
  }

  /**
   * Create size set button
   *
   * @returns {Element}
   */
  createSetSizeButton() {
    const button = make("button", [this.CSS.setSizeButton]);

    button.innerHTML = `${this.api.i18n.t("Resize")}`;

    button.addEventListener("click", (e) => {
      this.onSetImageSize();
      e.preventDefault();
    });

    return button;
  }

  /**
   * Create size reset button
   *
   * @returns {Element}
   */

  createResetSizeButton() {
    const button = make("button", [this.CSS.resetSizeButton]);
    button.innerHTML = `${this.api.i18n.t("Reset")}`;
    button.addEventListener("click", () => {
      this.nodes.inputWidth.value = "";
      this.nodes.inputHeight.value = "";
      this.nodes.setSizeButton.click();
    });

    return button;
  }

  /**
   * Create size set button
   *
   * @returns {Element}
   */

  createResizeModeButton() {
    const button = make("button", [this.CSS.resizeModeButton]);
    button.innerHTML = `${IconMarker}`;

    button.addEventListener("click", (e) => {
      this.nodes.resizeModeButton.style.display = "none";
      this.nodes.exitResizeModeButton.style.display = "inline-block";
      this.nodes.undoResizeButton.style.display = "inline-block";

      if (!this.config.isChangeResizeMode) {
        this.config.isChangeResizeMode = true;
        this.applyTune("resizeMode-on", this.config.isChangeResizeMode);

        this.nodes.setSizeButton.disabled = true;
        this.nodes.resetSizeButton.disabled = true;
        this.nodes.inputWidth.disabled = true;
        this.nodes.inputHeight.disabled = true;
        this.nodes.imageContainer.style.backgroundColor = "#f7f7f8";
        this.nodes.imageContainer.style.backgroundImage = `repeating-linear-gradient(45deg, #c9c9cb 25%, transparent 25%, transparent 75%, #c9c9cb 75%, #c9c9cb), repeating-linear-gradient(45deg, #c9c9cb 25%, #f7f7f8 25%, #f7f7f8 75%, #c9c9cb 75%, #c9c9cb)`;
        this.nodes.imageContainer.style.backgroundPosition = `0 0, 10px 10px`;
        this.nodes.imageContainer.style.backgroundSize = `20px 20px`;

        this.makeImageResizable(this.nodes.imageEl);
      }
    });

    return button;
  }

  /**
   * Create resize Mode Finished button
   *
   * @returns {Element}
   */

  createExitResizeModeButton() {
    const button = make("button", [this.CSS.exitResizeModeButton]);
    button.innerHTML = `${IconChecklist}`;
    button.style.display = "none";

    button.addEventListener("click", () => {
      this.nodes.resizeModeButton.style.display = "inline-block";
      this.nodes.exitResizeModeButton.style.display = "none";
      this.nodes.undoResizeButton.style.display = "none";

      if (this.config.isChangeResizeMode) {
        this.konva.stage.content.remove();
        this.nodes.imageContainer.style.backgroundColor = "";
        this.nodes.imageContainer.style.backgroundImage = "";
        this.nodes.imageContainer.style.backgroundPosition = "";
        this.nodes.imageContainer.style.backgroundSize = "";

        this.nodes.setSizeButton.disabled = false;
        this.nodes.resetSizeButton.disabled = false;
        this.nodes.inputWidth.disabled = false;
        this.nodes.inputHeight.disabled = false;
        this.nodes.resizeModeButton.disabled = false;

        const resizedWidth = parseInt(
          this.konva.group.parent.children[1].children[0].attrs.width,
          10
        );
        const resizedHeight = parseInt(
          this.konva.group.parent.children[1].children[0].attrs.height,
          10
        );

        this.nodes.inputWidth.value = resizedWidth;
        this.nodes.inputHeight.value = resizedHeight;
        this.nodes.imageEl.style.width = resizedWidth + "px";
        this.nodes.imageEl.style.height = resizedHeight + "px";
        this.nodes.imageContainer.appendChild(this.nodes.imageEl);
        this.config.isChangeResizeMode = false;
      }
    });

    return button;
  }

  createUndoResizeButton() {
    const button = make("button", [this.CSS.undoResizeButton]);
    button.innerHTML = `${IconUndo}`;
    button.style.display = "none";

    button.addEventListener("click", () => {
      this.konva.stage.destroyChildren();
      var layerForPrev = new Konva.Layer();
      this.konva.stage.add(layerForPrev);

      if (!this.konva.prevSize.width && !this.konva.prevSize.height) {
        var originW = this.nodes.imageEl.naturalWidth;
        var originH = this.nodes.imageEl.naturalHeight;

        var konvaWidth = this.config.konvaWidth;
        var konvaHeight = (originH / originW) * konvaWidth;

        if (originW < konvaWidth) {
          this.konva.prevSize.width = originW;
          this.konva.prevSize.height = originH;
        } else {
          this.konva.prevSize.width = konvaWidth;
          this.konva.prevSize.height = konvaHeight;
        }
      }

      var prevImage = new Konva.Image({
        width: this.konva.prevSize.width,
        height: this.konva.prevSize.height,
        draggable: true,
      });

      prevImage.image(this.nodes.imageEl);
      layerForPrev.add(prevImage);

      var trForPrev = new Konva.Transformer({
        rotateEnabled: false,
        enabledAnchors: [
          "top-center",
          "middle-right",
          "bottom-center",
          "middle-left",
          "top-left",
          "top-right",
          "bottom-left",
          "bottom-right",
        ],
      });

      this.konva.layer = layerForPrev;
      this.konva.group = prevImage;

      layerForPrev.add(trForPrev);

      trForPrev.nodes([prevImage]);

      this.konva.prevSize.width = Number(
        this.nodes.imageEl.style.width.split("px")[0]
      );

      this.konva.prevSize.height = Number(
        this.nodes.imageEl.style.height.split("px")[0]
      );
    });

    return button;
  }

  /**
   * Shows caption input
   *
   * @param {string} text - caption text
   * @returns {void}
   */
  fillCaption(text) {
    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = text;
    }
  }

  /**
   * Changes UI status
   *
   * @param {string} status - see {@link Ui.status} constants
   * @returns {void}
   */
  toggleStatus(status) {
    for (const statusType in Ui.status) {
      if (Object.prototype.hasOwnProperty.call(Ui.status, statusType)) {
        this.nodes.wrapper.classList.toggle(
          `${this.CSS.wrapper}--${Ui.status[statusType]}`,
          status === Ui.status[statusType]
        );
      }
    }
  }

  /**
   * Apply visual representation of activated tune
   *
   *  - one of available tunes {@link Tunes.tunes}
   * @param {boolean} status - true for enable, false for disable
   * @returns {void}
   */
  applyTune(tuneName, status) {
    this.nodes.wrapper.classList.toggle(
      `${this.CSS.wrapper}--${tuneName}`,
      status
    );
  }

  /**
   * Apply visual representation of activated tune
   *
   *  - one of available tunes {@link Tunes.tunes}
   *
   * @returns {void}
   */
  applyAlign() {
    this.nodes.leftAlign.classList.toggle(
      "image-tool__align-selected",
      this.config.isSelectedLeft
    );
    this.nodes.centerAlign.classList.toggle(
      "image-tool__align-selected",
      this.config.isSelectedCenter
    );
    this.nodes.rightAlign.classList.toggle(
      "image-tool__align-selected",
      this.config.isSelectedRight
    );
  }
}
