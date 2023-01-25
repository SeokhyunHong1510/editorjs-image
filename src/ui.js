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
      alignContainer: make("div", this.CSS.alignContainer),
      leftAlign: this.createLeftAlignButton(),
      centerAlign: this.createCenterAlignButton(),
      rightAlign: this.createRightAlignButton(),
      toolBarCenterContainer: make("div", this.CSS.toolBarCenterContainer),
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
      toolBarRightContainer: make("div", this.CSS.toolBarRightContainer),
      resizeModeButton: this.createResizeModeButton(),
      resizeModeFinishedButton: this.createResizeModeFinishedButton(),
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
        // this.nodes.inputWidth.value = this.nodes.imageEl.style.width;
      }
    });
    this.nodes.inputHeight.value = this.config.height;
    this.nodes.inputHeight.addEventListener("keydown", (e) => {
      if (e.keyCode === 13) {
        this.onSetImageSize();
        // this.nodes.inputHeight.value = this.nodes.imageEl.style.height;
      }
    });

    this.nodes.caption.dataset.placeholder = this.config.captionPlaceholder;
    this.nodes.wrapper.appendChild(this.nodes.imagePreloader);
    this.nodes.wrapper.appendChild(this.nodes.imageContainer);
    this.nodes.wrapper.appendChild(this.nodes.toolBarContainer);

    this.nodes.toolBarContainer.appendChild(this.nodes.alignContainer);
    this.nodes.toolBarContainer.appendChild(this.nodes.toolBarCenterContainer);
    this.nodes.toolBarContainer.appendChild(this.nodes.toolBarRightContainer);

    this.nodes.alignContainer.appendChild(this.nodes.leftAlign);
    this.nodes.alignContainer.appendChild(this.nodes.centerAlign);
    this.nodes.alignContainer.appendChild(this.nodes.rightAlign);

    this.nodes.resizeForm.appendChild(this.nodes.inputWidth);
    this.nodes.resizeForm.appendChild(this.nodes.inputHeight);
    this.nodes.resizeForm.appendChild(this.nodes.setSizeButton);
    this.nodes.resizeForm.appendChild(this.nodes.resetSizeButton);
    this.nodes.resizeForm.addEventListener("submit", (e) => {
      e.preventDefault();
    });

    this.nodes.toolBarCenterContainer.appendChild(this.nodes.resizeForm);
    this.nodes.toolBarRightContainer.appendChild(this.nodes.undoResizeButton);
    this.nodes.toolBarRightContainer.appendChild(this.nodes.resizeModeButton);
    this.nodes.toolBarRightContainer.appendChild(
      this.nodes.resizeModeFinishedButton
    );
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
      toolBarContainer: "image-tool__toolBar",
      alignContainer: "image-tool__toolBar__alignContainer",
      alignButton: "image-tool__toolBar__alignContainer-alignButton",
      leftAlign: "image-tool__toolBar__alignContainer-leftAlign",
      centerAlign: "image-tool__toolBar__alignContainer-centerAlign",
      rightAlign: "image-tool__toolBar__alignContainer-rightAlign",
      toolBarCenterContainer: "image-tool__toolBar__centerContainer",
      resizeForm: "image-tool__toolBar__centerContainer-resizeForm",
      setSizeButton: "image-tool__toolBar__centerContainer-setSizeButton",
      resetSizeButton: "image-tool__toolBar__centerContainer-resetSizeButton",
      toolBarRightContainer: "image-tool__toolBar__rightContainer",
      resizeModeButton: "image-tool__toolBar__rightContainer-resizeModeButton",
      resizeModeFinishedButton:
        "image-tool__toolBar__rightContainer-resizeModeFinishedButton",
      undoResizeButton: "image-tool__toolBar__rightContainer-undoResizeButton",
      caption: "image-tool__caption",
      setImage: "image-tool__setImage",
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
    this.nodes.imageEl.style.width = this.config.width;
    this.nodes.imageEl.style.height = this.config.height;

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

  /**
   * get width value entered or cotrolled by user
   *
   * @returns {String}
   */
  get getInputWidth() {
    return this.nodes.inputWidth.value;
  }

  /**
   * get height value entered or cotrolled by user
   *
   * @returns {String}
   */
  get getInputHeight() {
    return this.nodes.inputHeight.value;
  }

  makeImageResizable(imageEl) {
    var imgWidth = this.nodes.imageEl.width;
    var imgHeight = this.nodes.imageEl.height;

    var ceBlockContentNodes = document.querySelectorAll(".ce-block__content");

    if (ceBlockContentNodes.length > 0) {
      this.config.konvaWidth = ceBlockContentNodes[0].clientWidth;
    }
    var canvasWidth = this.config.konvaWidth;
    var canvasHeight = (imgHeight / imgWidth) * canvasWidth;

    var stage = new Konva.Stage({
      container: this.nodes.imageContainer,
      width: canvasWidth,
      height: canvasHeight,
    });

    var layer = new Konva.Layer();
    stage.add(layer);

    // 이미지 사이즈
    var resizeImg = new Konva.Image({
      // width : imgWidth,
      // height: imgHeight,
      width: this.config.width,
      height: this.config.height,
      draggable: true,
    });

    // 이미지를 설정 전달
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

    if (this.nodes.inputWidth.value) {
      if (this.nodes.inputHeight.value) {
        this.nodes.imageEl.style.width = getWidthValue;
        this.nodes.imageEl.style.height = getHeightValue;
      } else {
        this.nodes.imageEl.style.width = getWidthValue;
        this.nodes.imageEl.style.height = prevHeight;
      }
    } else {
      if (this.nodes.inputHeight.value) {
        this.nodes.imageEl.style.width = prevWidth;
        this.nodes.imageEl.style.height = getHeightValue;
      }
    }
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
      if (
        this.nodes.inputWidth.value !== "" ||
        this.nodes.inputHeight.value !== ""
      ) {
        this.onSetImageSize();
      } else {
        e.preventDefault();
      }
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
      this.nodes.imageEl.style.width = this.config.width;
      this.nodes.imageEl.style.height = this.config.height;
      this.nodes.inputWidth.value = "";
      this.nodes.inputHeight.value = "";
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

    button.addEventListener("click", () => {
      if (!this.config.isChangeResizeMode) {
        this.config.isChangeResizeMode = true;
        this.applyTune("resizeMode-on", this.config.isChangeResizeMode);

        // konva.prevSize가 존재할때 undoResizeButton 생성
        if (this.konva.prevSize) {
          this.nodes.undoResizeButton.style.visibility = "visible";
          this.konva.prevSize.width = Number(
            this.nodes.imageEl.style.width.split("px")[0]
          );
          this.konva.prevSize.height = Number(
            this.nodes.imageEl.style.height.split("px")[0]
          );
        }

        this.nodes.resizeModeButton.disabled = true;
        this.nodes.resizeModeButton.style.color = "#388ae5";
        this.nodes.resizeModeButton.style.border = "2px solid #388ae5";
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

  createResizeModeFinishedButton() {
    const button = make("button", [this.CSS.resizeModeFinishedButton]);

    // button.innerHTML = `${this.api.i18n.t("ok")}`;
    button.innerHTML = `${IconChecklist}`;

    button.addEventListener("click", () => {
      if (this.config.isChangeResizeMode) {
        this.konva.stage.content.remove();
        this.nodes.resizeModeButton.style.color = "";
        this.nodes.resizeModeButton.style.border = "";
        this.nodes.imageContainer.style.backgroundImage = "";
        this.nodes.imageContainer.style.backgroundColor = "";
        this.nodes.imageContainer.style.backgroundImage = "";
        this.nodes.imageContainer.style.backgroundPosition = "";
        this.nodes.imageContainer.style.backgroundSize = "";

        this.nodes.undoResizeButton.style.visibility = "hidden";
        this.nodes.setSizeButton.disabled = false;
        this.nodes.resetSizeButton.disabled = false;
        this.nodes.inputWidth.disabled = false;
        this.nodes.inputHeight.disabled = false;

        this.config.width =
          this.konva.group.parent.children[1].children[0].attrs.width;
        this.config.height =
          this.konva.group.parent.children[1].children[0].attrs.height;
        this.nodes.imageEl.style.cssText = `width:${this.config.width}px;height:${this.config.height}px;`;
        this.nodes.imageContainer.appendChild(this.nodes.imageEl);
        this.nodes.inputWidth.value = parseInt(this.config.width, 10);
        this.nodes.inputHeight.value = parseInt(this.config.height, 10);
        this.nodes.resizeModeButton.disabled = false;
        this.config.isChangeResizeMode = false;
      }
    });

    return button;
  }

  createUndoResizeButton() {
    const button = make("button", [this.CSS.undoResizeButton]);
    button.innerHTML = `${IconUndo}`;

    button.addEventListener("click", () => {
      this.konva.stage.destroyChildren();

      var layerForPrev = new Konva.Layer();
      this.konva.stage.add(layerForPrev);

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
