(function($) {
	$.widget('oc.ocdialog', {
		options: {
			width: 'auto',
			height: 'auto',
			closeButton: true,
			closeOnEscape: true,
			modal: false
		},
		_create: function() {
			var self = this;

			this.originalCss = {
				display: this.element[0].style.display,
				width: this.element[0].style.width,
				height: this.element[0].style.height
			};

			this.originalTitle = this.element.attr('title');
			this.options.title = this.options.title || this.originalTitle;

			this.$dialog = $('<div class="oc-dialog" />')
				.attr({
					// Setting tabIndex makes the div focusable
					tabIndex: -1,
					role: 'dialog'
				})
				.insertBefore(this.element);
			this.$dialog.append(this.element.detach());
			this.element.removeAttr('title').addClass('oc-dialog-content').appendTo(this.$dialog);

			this.$dialog.css({
				display: 'inline-block',
				position: 'fixed'
			});

			$(document).on('keydown keyup', function(event) {
				if (
					event.target !== self.$dialog.get(0) &&
					self.$dialog.find($(event.target)).length === 0
				) {
					return;
				}
				// Escape
				if (
					event.keyCode === 27 &&
					event.type === 'keydown' &&
					self.options.closeOnEscape
				) {
					event.stopImmediatePropagation();
					self.close();
					return false;
				}
				// Enter
				if(event.keyCode === 13) {
					event.stopImmediatePropagation();
					if(event.type === 'keyup') {
						event.preventDefault();
						return false;
					}
					// If no button is selected we trigger the primary
					if (
						self.$buttonrow &&
						self.$buttonrow.find($(event.target)).length === 0
					) {
						var $button = self.$buttonrow.find('button.primary');
						if($button) {
							$button.trigger('click');
						}
					} else if(self.$buttonrow) {
						$(event.target).trigger('click');
					}
					return false;
				}
			});

			this._setOptions(this.options);
			this._createOverlay();
		},
		_init: function() {
			this.$dialog.focus();
			this._trigger('open');
		},
		_setOption: function(key, value) {
			var self = this;
			switch(key) {
				case 'title':
					if(this.$title) {
						this.$title.text(value);
					} else {
						var $title = $('<h2 class="oc-dialog-title">'
							+ value
							+ '</h2>');
						this.$title = $title.prependTo(this.$dialog);
					}
					this._setSizes();
					break;
				case 'buttons':
					if(this.$buttonrow) {
						this.$buttonrow.empty();
					} else {
						var $buttonrow = $('<div class="oc-dialog-buttonrow" />');
						this.$buttonrow = $buttonrow.appendTo(this.$dialog);
					}
					if (value.length === 1) {
						this.$buttonrow.addClass('onebutton');
					} else if (value.length === 2) {
						this.$buttonrow.addClass('twobuttons');
					} else if (value.length === 3) {
						this.$buttonrow.addClass('threebuttons');
					}
					$.each(value, function(idx, val) {
						var $button = $('<button>').text(val.text);
						if (val.classes) {
							$button.addClass(val.classes);
						}
						if(val.defaultButton) {
							$button.addClass('primary');
							self.$defaultButton = $button;
						}
						self.$buttonrow.append($button);
						$button.click(function() {
							val.click.apply(self.element[0], arguments);
						});
					});
					this.$buttonrow.find('button')
						.on('focus', function(event) {
							self.$buttonrow.find('button').removeClass('primary');
							$(this).addClass('primary');
						});
					this._setSizes();
					break;
				case 'style':
					if (value.buttons !== undefined) {
						this.$buttonrow.addClass(value.buttons);
					}
					break;
				case 'closeButton':
					if(value) {
						var $closeButton = $('<a class="oc-dialog-close"></a>');
						this.$dialog.prepend($closeButton);
						$closeButton.on('click', function() {
							self.close();
						});
					} else {
						this.$dialog.find('.oc-dialog-close').remove();
					}
					break;
				case 'width':
					this.$dialog.css('width', value);
					break;
				case 'height':
					this.$dialog.css('height', value);
					break;
				case 'close':
					this.closeCB = value;
					break;
			}
			//this._super(key, value);
			$.Widget.prototype._setOption.apply(this, arguments );
		},
		_setOptions: function(options) {
			//this._super(options);
			$.Widget.prototype._setOptions.apply(this, arguments);
		},
		_setSizes: function() {
			var lessHeight = 0;
			if(this.$title) {
				lessHeight += this.$title.outerHeight(true);
			}
			if(this.$buttonrow) {
				lessHeight += this.$buttonrow.outerHeight(true);
			}
			this.element.css({
				'height': 'calc(100% - ' + lessHeight + 'px)'
			});
		},
		_createOverlay: function() {
			if(!this.options.modal) {
				return;
			}

			var self = this;
			this.overlay = $('<div>')
				.addClass('oc-dialog-dim')
				.appendTo($('#content'));
			this.overlay.on('click keydown keyup', function(event) {
				if(event.target !== self.$dialog.get(0) && self.$dialog.find($(event.target)).length === 0) {
					event.preventDefault();
					event.stopPropagation();
					return;
				}
			});
		},
		_destroyOverlay: function() {
			if (!this.options.modal) {
				return;
			}

			if (this.overlay) {
				this.overlay.off('click keydown keyup');
				this.overlay.remove();
				this.overlay = null;
			}
		},
		widget: function() {
			return this.$dialog;
		},
		close: function() {
			this._destroyOverlay();
			var self = this;
			// Ugly hack to catch remaining keyup events.
			setTimeout(function() {
				self._trigger('close', self);
			}, 200);

			self.$dialog.remove();
			this.destroy();
		},
		destroy: function() {
			if(this.$title) {
				this.$title.remove();
			}
			if(this.$buttonrow) {
				this.$buttonrow.remove();
			}

			if(this.originalTitle) {
				this.element.attr('title', this.originalTitle);
			}
			this.element.removeClass('oc-dialog-content')
					.css(this.originalCss).detach().insertBefore(this.$dialog);
			this.$dialog.remove();
		}
	});
}(jQuery));


/**
 * ownCloud
 *
 * @author Bartek Przybylski, Christopher Schäpers, Thomas Tanghus
 * @copyright 2012 Bartek Przybylski bartek@alefzero.eu
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/* global alert */

/**
 * this class to ease the usage of jquery dialogs
 * @lends OC.dialogs
 */
var OCdialogs = {
	// dialog button types
	YES_NO_BUTTONS:		70,
	OK_BUTTONS:		71,

	FILEPICKER_TYPE_CHOOSE: 1,
	FILEPICKER_TYPE_MOVE: 2,
	FILEPICKER_TYPE_COPY: 3,
	FILEPICKER_TYPE_COPY_MOVE: 4,

	// used to name each dialog
	dialogsCounter: 0,
	/**
	* displays alert dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses OK
	* @param modal make the dialog modal
	*/
	alert:function(text, title, callback, modal) {
		this.message(
			text,
			title,
			'alert',
			OCdialogs.OK_BUTTON,
			callback,
			modal
		);
	},
	/**
	* displays info dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses OK
	* @param modal make the dialog modal
	*/
	info:function(text, title, callback, modal) {
		this.message(text, title, 'info', OCdialogs.OK_BUTTON, callback, modal);
	},
	/**
	* displays confirmation dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses YES or NO
	*        (true or false would be passed to callback respectively)
	* @param modal make the dialog modal
	*/
	confirm:function(text, title, callback, modal) {
		return this.message(
			text,
			title,
			'notice',
			OCdialogs.YES_NO_BUTTONS,
			callback,
			modal
		);
	},
	/**
	* displays confirmation dialog
	* @param text content of dialog
	* @param title dialog title
	* @param callback which will be triggered when user presses YES or NO
	*        (true or false would be passed to callback respectively)
	* @param modal make the dialog modal
	*/
	confirmHtml:function(text, title, callback, modal) {
		return this.message(
			text,
			title,
			'notice',
			OCdialogs.YES_NO_BUTTONS,
			callback,
			modal,
			true
		);
	},
	/**
	 * displays prompt dialog
	 * @param text content of dialog
	 * @param title dialog title
	 * @param callback which will be triggered when user presses YES or NO
	 *        (true or false would be passed to callback respectively)
	 * @param modal make the dialog modal
	 * @param name name of the input field
	 * @param password whether the input should be a password input
	 */
	prompt: function (text, title, callback, modal, name, password) {
		return $.when(this._getMessageTemplate()).then(function ($tmpl) {
			var dialogName = 'oc-dialog-' + OCdialogs.dialogsCounter + '-content';
			var dialogId = '#' + dialogName;
			var $dlg = $tmpl.octemplate({
				dialog_name: dialogName,
				title      : title,
				message    : text,
				type       : 'notice'
			});
			var input = $('<input/>');
			input.attr('type', password ? 'password' : 'text').attr('id', dialogName + '-input');
			var label = $('<label/>').attr('for', dialogName + '-input').text(name + ': ');
			$dlg.append(label);
			$dlg.append(input);
			if (modal === undefined) {
				modal = false;
			}
			$('body').append($dlg);

			// wrap callback in _.once():
			// only call callback once and not twice (button handler and close
			// event) but call it for the close event, if ESC or the x is hit
			if (callback !== undefined) {
				callback = _.once(callback);
			}

			var buttonlist = [{
					text : t('core', 'No'),
					click: function () {
						if (callback !== undefined) {
							callback(false, input.val());
						}
						$(dialogId).ocdialog('close');
					}
				}, {
					text         : t('core', 'Yes'),
					click        : function () {
						if (callback !== undefined) {
							callback(true, input.val());
						}
						$(dialogId).ocdialog('close');
					},
					defaultButton: true
				}
			];

			$(dialogId).ocdialog({
				closeOnEscape: true,
				modal        : modal,
				buttons      : buttonlist,
				close        : function() {
					// callback is already fired if Yes/No is clicked directly
					if (callback !== undefined) {
						callback(false, input.val());
					}
				}
			});
			input.focus();
			OCdialogs.dialogsCounter++;
		});
	},
	/**
	 * show a file picker to pick a file from
	 * @param title dialog title
	 * @param callback which will be triggered when user presses Choose
	 * @param multiselect whether it should be possible to select multiple files
	 * @param mimetypeFilter mimetype to filter by - directories will always be included
	 * @param modal make the dialog modal
	 * @param type Type of file picker : Choose, copy, move, copy and move
	*/
	filepicker:function(title, callback, multiselect, mimetypeFilter, modal, type) {
		var self = this;
		// avoid opening the picker twice
		if (this.filepicker.loading) {
			return;
		}

		if (type === undefined) {
			type = this.FILEPICKER_TYPE_CHOOSE;
		}

		this.filepicker.loading = true;
		this.filepicker.filesClient = (OCA.Sharing && OCA.Sharing.PublicApp && OCA.Sharing.PublicApp.fileList)? OCA.Sharing.PublicApp.fileList.filesClient: OC.Files.getClient();
		$.when(this._getFilePickerTemplate()).then(function($tmpl) {
			self.filepicker.loading = false;
			var dialogName = 'oc-dialog-filepicker-content';
			if(self.$filePicker) {
				self.$filePicker.ocdialog('close');
			}
			self.$filePicker = $tmpl.octemplate({
				dialog_name: dialogName,
				title: title,
				emptytext: t('core', 'No files in here')
			}).data('path', '').data('multiselect', multiselect).data('mimetype', mimetypeFilter);

			if (modal === undefined) {
				modal = false;
			}
			if (multiselect === undefined) {
				multiselect = false;
			}
			if (mimetypeFilter === undefined) {
				mimetypeFilter = '';
			}

			$('body').append(self.$filePicker);

			self.$filePicker.ready(function() {
				self.$filelist = self.$filePicker.find('.filelist tbody');
				self.$dirTree = self.$filePicker.find('.dirtree');
				self.$dirTree.on('click', 'div:not(:last-child)', self, function (event) {
					self._handleTreeListSelect(event, type);
				});
				self.$filelist.on('click', 'tr', function(event) {
					self._handlePickerClick(event, $(this), type);
				});
				self._fillFilePicker('');
			});

			// build buttons
			var functionToCall = function(returnType) {
				if (callback !== undefined) {
					var datapath;
					if (multiselect === true) {
						datapath = [];
						self.$filelist.find('tr.filepicker_element_selected').each(function(index, element) {
							datapath.push(self.$filePicker.data('path') + '/' + $(element).data('entryname'));
						});
					} else {
						datapath = self.$filePicker.data('path');
						var selectedName = self.$filelist.find('tr.filepicker_element_selected').data('entryname');
						if (selectedName) {
							datapath += '/' + selectedName;
						}
					}
					callback(datapath, returnType);
					self.$filePicker.ocdialog('close');
				}
			};

			var chooseCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_CHOOSE);
			};

			var copyCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_COPY);
			};

			var moveCallback = function () {
				functionToCall(OCdialogs.FILEPICKER_TYPE_MOVE);
			};

			var buttonlist = [];
			if (type === OCdialogs.FILEPICKER_TYPE_CHOOSE) {
				buttonlist.push({
					text: t('core', 'Choose'),
					click: chooseCallback,
					defaultButton: true
				});
			} else {
				if (type === OCdialogs.FILEPICKER_TYPE_COPY || type === OCdialogs.FILEPICKER_TYPE_COPY_MOVE) {
					buttonlist.push({
						text: t('core', 'Copy'),
						click: copyCallback,
						defaultButton: false
					});
				}
				if (type === OCdialogs.FILEPICKER_TYPE_MOVE || type === OCdialogs.FILEPICKER_TYPE_COPY_MOVE) {
					buttonlist.push({
						text: t('core', 'Move'),
						click: moveCallback,
						defaultButton: true
					});
				}
			}

			self.$filePicker.ocdialog({
				closeOnEscape: true,
				// max-width of 600
				width: 600,
				height: 500,
				modal: modal,
				buttons: buttonlist,
				style: {
					buttons: 'aside',
				},
				close: function() {
					try {
						$(this).ocdialog('destroy').remove();
					} catch(e) {}
					self.$filePicker = null;
				}
			});

			// We can access primary class only from oc-dialog.
			// Hence this is one of the approach to get the choose button.
			var getOcDialog = self.$filePicker.closest('.oc-dialog');
			var buttonEnableDisable = getOcDialog.find('.primary');
			if (self.$filePicker.data('mimetype') === "httpd/unix-directory") {
				buttonEnableDisable.prop("disabled", false);
			} else {
				buttonEnableDisable.prop("disabled", true);
			}
		})
		.fail(function(status, error) {
			// If the method is called while navigating away
			// from the page, it is probably not needed ;)
			self.filepicker.loading = false;
			if(status !== 0) {
				alert(t('core', 'Error loading file picker template: {error}', {error: error}));
			}
		});
	},
	/**
	 * Displays raw dialog
	 * You better use a wrapper instead ...
	*/
	message:function(content, title, dialogType, buttons, callback, modal, allowHtml) {
		return $.when(this._getMessageTemplate()).then(function($tmpl) {
			var dialogName = 'oc-dialog-' + OCdialogs.dialogsCounter + '-content';
			var dialogId = '#' + dialogName;
			var $dlg = $tmpl.octemplate({
				dialog_name: dialogName,
				title: title,
				message: content,
				type: dialogType
			}, allowHtml ? {escapeFunction: ''} : {});
			if (modal === undefined) {
				modal = false;
			}
			$('body').append($dlg);
			var buttonlist = [];
			switch (buttons) {
			case OCdialogs.YES_NO_BUTTONS:
				buttonlist = [{
					text: t('core', 'No'),
					click: function(){
						if (callback !== undefined) {
							callback(false);
						}
						$(dialogId).ocdialog('close');
					}
				},
				{
					text: t('core', 'Yes'),
					click: function(){
						if (callback !== undefined) {
							callback(true);
						}
						$(dialogId).ocdialog('close');
					},
					defaultButton: true
				}];
				break;
			case OCdialogs.OK_BUTTON:
				var functionToCall = function() {
					$(dialogId).ocdialog('close');
					if(callback !== undefined) {
						callback();
					}
				};
				buttonlist[0] = {
					text: t('core', 'OK'),
					click: functionToCall,
					defaultButton: true
				};
				break;
			}

			$(dialogId).ocdialog({
				closeOnEscape: true,
				modal: modal,
				buttons: buttonlist
			});
			OCdialogs.dialogsCounter++;
		})
		.fail(function(status, error) {
			// If the method is called while navigating away from
			// the page, we still want to deliver the message.
			if(status === 0) {
				alert(title + ': ' + content);
			} else {
				alert(t('core', 'Error loading message template: {error}', {error: error}));
			}
		});
	},
	_fileexistsshown: false,
	/**
	 * Displays file exists dialog
	 * @param {object} data upload object
	 * @param {object} original file with name, size and mtime
	 * @param {object} replacement file with name, size and mtime
	 * @param {object} controller with onCancel, onSkip, onReplace and onRename methods
	 * @return {Promise} jquery promise that resolves after the dialog template was loaded
	*/
	fileexists:function(data, original, replacement, controller) {
		var self = this;
		var dialogDeferred = new $.Deferred();

		var getCroppedPreview = function(file) {
			var deferred = new $.Deferred();
			// Only process image files.
			var type = file.type && file.type.split('/').shift();
			if (window.FileReader && type === 'image') {
				var reader = new FileReader();
				reader.onload = function (e) {
					var blob = new Blob([e.target.result]);
					window.URL = window.URL || window.webkitURL;
					var originalUrl = window.URL.createObjectURL(blob);
					var image = new Image();
					image.src = originalUrl;
					image.onload = function () {
						var url = crop(image);
						deferred.resolve(url);
					};
				};
				reader.readAsArrayBuffer(file);
			} else {
				deferred.reject();
			}
			return deferred;
		};

		var crop = function(img) {
			var canvas = document.createElement('canvas'),
					targetSize = 96,
					width = img.width,
					height = img.height,
					x, y, size;

			// Calculate the width and height, constraining the proportions
			if (width > height) {
				y = 0;
				x = (width - height) / 2;
			} else {
				y = (height - width) / 2;
				x = 0;
			}
			size = Math.min(width, height);

			// Set canvas size to the cropped area
			canvas.width = size;
			canvas.height = size;
			var ctx = canvas.getContext("2d");
			ctx.drawImage(img, x, y, size, size, 0, 0, size, size);

			// Resize the canvas to match the destination (right size uses 96px)
			resampleHermite(canvas, size, size, targetSize, targetSize);

			return canvas.toDataURL("image/png", 0.7);
		};

		/**
		 * Fast image resize/resample using Hermite filter with JavaScript.
		 *
		 * @author: ViliusL
		 *
		 * @param {*} canvas
		 * @param {number} W
		 * @param {number} H
		 * @param {number} W2
		 * @param {number} H2
		 */
		var resampleHermite = function (canvas, W, H, W2, H2) {
			W2 = Math.round(W2);
			H2 = Math.round(H2);
			var img = canvas.getContext("2d").getImageData(0, 0, W, H);
			var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
			var data = img.data;
			var data2 = img2.data;
			var ratio_w = W / W2;
			var ratio_h = H / H2;
			var ratio_w_half = Math.ceil(ratio_w / 2);
			var ratio_h_half = Math.ceil(ratio_h / 2);

			for (var j = 0; j < H2; j++) {
				for (var i = 0; i < W2; i++) {
					var x2 = (i + j * W2) * 4;
					var weight = 0;
					var weights = 0;
					var weights_alpha = 0;
					var gx_r = 0;
					var gx_g = 0;
					var gx_b = 0;
					var gx_a = 0;
					var center_y = (j + 0.5) * ratio_h;
					for (var yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++) {
						var dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half;
						var center_x = (i + 0.5) * ratio_w;
						var w0 = dy * dy; //pre-calc part of w
						for (var xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++) {
							var dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half;
							var w = Math.sqrt(w0 + dx * dx);
							if (w >= -1 && w <= 1) {
								//hermite filter
								weight = 2 * w * w * w - 3 * w * w + 1;
								if (weight > 0) {
									dx = 4 * (xx + yy * W);
									//alpha
									gx_a += weight * data[dx + 3];
									weights_alpha += weight;
									//colors
									if (data[dx + 3] < 255)
										weight = weight * data[dx + 3] / 250;
									gx_r += weight * data[dx];
									gx_g += weight * data[dx + 1];
									gx_b += weight * data[dx + 2];
									weights += weight;
								}
							}
						}
					}
					data2[x2] = gx_r / weights;
					data2[x2 + 1] = gx_g / weights;
					data2[x2 + 2] = gx_b / weights;
					data2[x2 + 3] = gx_a / weights_alpha;
				}
			}
			canvas.getContext("2d").clearRect(0, 0, Math.max(W, W2), Math.max(H, H2));
			canvas.width = W2;
			canvas.height = H2;
			canvas.getContext("2d").putImageData(img2, 0, 0);
		};

		var addConflict = function($conflicts, original, replacement) {

			var $conflict = $conflicts.find('.template').clone().removeClass('template').addClass('conflict');
			var $originalDiv = $conflict.find('.original');
			var $replacementDiv = $conflict.find('.replacement');

			$conflict.data('data',data);

			$conflict.find('.filename').text(original.name);
			$originalDiv.find('.size').text(humanFileSize(original.size));
			$originalDiv.find('.mtime').text(formatDate(original.mtime));
			// ie sucks
			if (replacement.size && replacement.lastModifiedDate) {
				$replacementDiv.find('.size').text(humanFileSize(replacement.size));
				$replacementDiv.find('.mtime').text(formatDate(replacement.lastModifiedDate));
			}
			var path = original.directory + '/' +original.name;
			var urlSpec = {
				file:		path,
				x:		96,
				y:		96,
				c:		original.etag,
				forceIcon:	0
			};
			var previewpath = Files.generatePreviewUrl(urlSpec);
			// Escaping single quotes
			previewpath = previewpath.replace(/'/g, "%27");
			$originalDiv.find('.icon').css({"background-image":   "url('" + previewpath + "')"});
			getCroppedPreview(replacement).then(
				function(path){
					$replacementDiv.find('.icon').css('background-image','url(' + path + ')');
				}, function(){
					path = OC.MimeType.getIconUrl(replacement.type);
					$replacementDiv.find('.icon').css('background-image','url(' + path + ')');
				}
			);
			// connect checkboxes with labels
			var checkboxId = $conflicts.find('.conflict').length;
			$originalDiv.find('input:checkbox').attr('id', 'checkbox_original_'+checkboxId);
			$replacementDiv.find('input:checkbox').attr('id', 'checkbox_replacement_'+checkboxId);

			$conflicts.append($conflict);

			//set more recent mtime bold
			// ie sucks
			if (replacement.lastModifiedDate && replacement.lastModifiedDate.getTime() > original.mtime) {
				$replacementDiv.find('.mtime').css('font-weight', 'bold');
			} else if (replacement.lastModifiedDate && replacement.lastModifiedDate.getTime() < original.mtime) {
				$originalDiv.find('.mtime').css('font-weight', 'bold');
			} else {
				//TODO add to same mtime collection?
			}

			// set bigger size bold
			if (replacement.size && replacement.size > original.size) {
				$replacementDiv.find('.size').css('font-weight', 'bold');
			} else if (replacement.size && replacement.size < original.size) {
				$originalDiv.find('.size').css('font-weight', 'bold');
			} else {
				//TODO add to same size collection?
			}

			//TODO show skip action for files with same size and mtime in bottom row

			// always keep readonly files

			if (original.status === 'readonly') {
				$originalDiv
					.addClass('readonly')
					.find('input[type="checkbox"]')
						.prop('checked', true)
						.prop('disabled', true);
				$originalDiv.find('.message')
					.text(t('core','read-only'));
			}
		};
		//var selection = controller.getSelection(data.originalFiles);
		//if (selection.defaultAction) {
		//	controller[selection.defaultAction](data);
		//} else {
		var dialogName = 'oc-dialog-fileexists-content';
		var dialogId = '#' + dialogName;
		if (this._fileexistsshown) {
			// add conflict

			var $conflicts = $(dialogId+ ' .conflicts');
			addConflict($conflicts, original, replacement);

			var count = $(dialogId+ ' .conflict').length;
			var title = n('core',
							'{count} file conflict',
							'{count} file conflicts',
							count,
							{count:count}
						);
			$(dialogId).parent().children('.oc-dialog-title').text(title);

			//recalculate dimensions
			$(window).trigger('resize');
			dialogDeferred.resolve();
		} else {
			//create dialog
			this._fileexistsshown = true;
			$.when(this._getFileExistsTemplate()).then(function($tmpl) {
				var title = t('core','One file conflict');
				var $dlg = $tmpl.octemplate({
					dialog_name: dialogName,
					title: title,
					type: 'fileexists',

					allnewfiles: t('core','New Files'),
					allexistingfiles: t('core','Already existing files'),

					why: t('core','Which files do you want to keep?'),
					what: t('core','If you select both versions, the copied file will have a number added to its name.')
				});
				$('body').append($dlg);

				if (original && replacement) {
					var $conflicts = $dlg.find('.conflicts');
					addConflict($conflicts, original, replacement);
				}

				var buttonlist = [{
						text: t('core', 'Cancel'),
						classes: 'cancel',
						click: function(){
							if ( typeof controller.onCancel !== 'undefined') {
								controller.onCancel(data);
							}
							$(dialogId).ocdialog('close');
						}
					},
					{
						text: t('core', 'Continue'),
						classes: 'continue',
						click: function(){
							if ( typeof controller.onContinue !== 'undefined') {
								controller.onContinue($(dialogId + ' .conflict'));
							}
							$(dialogId).ocdialog('close');
						}
					}];

				$(dialogId).ocdialog({
					width: 500,
					closeOnEscape: true,
					modal: true,
					buttons: buttonlist,
					closeButton: null,
					close: function() {
							self._fileexistsshown = false;
							$(this).ocdialog('destroy').remove();
						}
				});

				$(dialogId).css('height','auto');

				var $primaryButton = $dlg.closest('.oc-dialog').find('button.continue');
				$primaryButton.prop('disabled', true);

				function updatePrimaryButton() {
					var checkedCount = $dlg.find('.conflicts .checkbox:checked').length;
					$primaryButton.prop('disabled', checkedCount === 0);
				}

				//add checkbox toggling actions
				$(dialogId).find('.allnewfiles').on('click', function() {
					var $checkboxes = $(dialogId).find('.conflict .replacement input[type="checkbox"]');
					$checkboxes.prop('checked', $(this).prop('checked'));
				});
				$(dialogId).find('.allexistingfiles').on('click', function() {
					var $checkboxes = $(dialogId).find('.conflict .original:not(.readonly) input[type="checkbox"]');
					$checkboxes.prop('checked', $(this).prop('checked'));
				});
				$(dialogId).find('.conflicts').on('click', '.replacement,.original:not(.readonly)', function() {
					var $checkbox = $(this).find('input[type="checkbox"]');
					$checkbox.prop('checked', !$checkbox.prop('checked'));
				});
				$(dialogId).find('.conflicts').on('click', '.replacement input[type="checkbox"],.original:not(.readonly) input[type="checkbox"]', function() {
					var $checkbox = $(this);
					$checkbox.prop('checked', !$checkbox.prop('checked'));
				});

				//update counters
				$(dialogId).on('click', '.replacement,.allnewfiles', function() {
					var count = $(dialogId).find('.conflict .replacement input[type="checkbox"]:checked').length;
					if (count === $(dialogId+ ' .conflict').length) {
						$(dialogId).find('.allnewfiles').prop('checked', true);
						$(dialogId).find('.allnewfiles + .count').text(t('core','(all selected)'));
					} else if (count > 0) {
						$(dialogId).find('.allnewfiles').prop('checked', false);
						$(dialogId).find('.allnewfiles + .count').text(t('core','({count} selected)',{count:count}));
					} else {
						$(dialogId).find('.allnewfiles').prop('checked', false);
						$(dialogId).find('.allnewfiles + .count').text('');
					}
					updatePrimaryButton();
				});
				$(dialogId).on('click', '.original,.allexistingfiles', function(){
					var count = $(dialogId).find('.conflict .original input[type="checkbox"]:checked').length;
					if (count === $(dialogId+ ' .conflict').length) {
						$(dialogId).find('.allexistingfiles').prop('checked', true);
						$(dialogId).find('.allexistingfiles + .count').text(t('core','(all selected)'));
					} else if (count > 0) {
						$(dialogId).find('.allexistingfiles').prop('checked', false);
						$(dialogId).find('.allexistingfiles + .count')
							.text(t('core','({count} selected)',{count:count}));
					} else {
						$(dialogId).find('.allexistingfiles').prop('checked', false);
						$(dialogId).find('.allexistingfiles + .count').text('');
					}
					updatePrimaryButton();
				});

				dialogDeferred.resolve();
			})
			.fail(function() {
				dialogDeferred.reject();
				alert(t('core', 'Error loading file exists template'));
			});
		}
		//}
		return dialogDeferred.promise();
	},
	_getFilePickerTemplate: function() {
		var defer = $.Deferred();
		if(!this.$filePickerTemplate) {
			var self = this;
			$.get(OC.filePath('core', 'templates', 'filepicker.html'), function(tmpl) {
				self.$filePickerTemplate = $(tmpl);
				self.$listTmpl = self.$filePickerTemplate.find('.filelist tr:first-child').detach();
				defer.resolve(self.$filePickerTemplate);
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				defer.reject(jqXHR.status, errorThrown);
			});
		} else {
			defer.resolve(this.$filePickerTemplate);
		}
		return defer.promise();
	},
	_getMessageTemplate: function() {
		var defer = $.Deferred();
		if(!this.$messageTemplate) {
			var self = this;
			$.get(OC.filePath('core', 'templates', 'message.html'), function(tmpl) {
				self.$messageTemplate = $(tmpl);
				defer.resolve(self.$messageTemplate);
			})
			.fail(function(jqXHR, textStatus, errorThrown) {
				defer.reject(jqXHR.status, errorThrown);
			});
		} else {
			defer.resolve(this.$messageTemplate);
		}
		return defer.promise();
	},
	_getFileExistsTemplate: function () {
		var defer = $.Deferred();
		if (!this.$fileexistsTemplate) {
			var self = this;
			$.get(OC.filePath('files', 'templates', 'fileexists.html'), function (tmpl) {
				self.$fileexistsTemplate = $(tmpl);
				defer.resolve(self.$fileexistsTemplate);
			})
			.fail(function () {
				defer.reject();
			});
		} else {
			defer.resolve(this.$fileexistsTemplate);
		}
		return defer.promise();
	},
	_getFileList: function(dir, mimeType) { //this is only used by the spreedme app atm
		if (typeof(mimeType) === "string") {
			mimeType = [mimeType];
		}

		return $.getJSON(
			OC.filePath('files', 'ajax', 'list.php'),
			{
				dir: dir,
				mimetypes: JSON.stringify(mimeType)
			}
		);
	},

	/**
	 * fills the filepicker with files
	*/
	_fillFilePicker:function(dir) {
		var self = this;
		this.$filelist.empty().addClass('icon-loading');
		this.$filePicker.data('path', dir);
		var filter = this.$filePicker.data('mimetype');
		if (typeof(filter) === "string") {
			filter = [filter];
		}
		self.filepicker.filesClient.getFolderContents(dir).then(function(status, files) {
			if (filter) {
				files = files.filter(function (file) {
					return filter == [] || file.type === 'dir' || filter.indexOf(file.mimetype) !== -1;
				});
			}
			files = files.sort(function(a, b) {
				if (a.type === 'dir' && b.type !== 'dir') {
					return -1;
				} else if(a.type !== 'dir' && b.type === 'dir') {
					return 1;
				} else {
					return 0;
				}
			});

			self._fillSlug();

			if (files.length === 0) {
				self.$filePicker.find('.emptycontent').show();
			} else {
				self.$filePicker.find('.emptycontent').hide();
			}

			$.each(files, function(idx, entry) {
				entry.icon = OC.MimeType.getIconUrl(entry.mimetype);
				var simpleSize, sizeColor;
				if (typeof(entry.size) !== 'undefined' && entry.size >= 0) {
					simpleSize = humanFileSize(parseInt(entry.size, 10), true);
					sizeColor = Math.round(160 - Math.pow((entry.size / (1024 * 1024)), 2));
				} else {
					simpleSize = t('files', 'Pending');
					sizeColor = 80;
				}
				var $row = self.$listTmpl.octemplate({
					type: entry.type,
					dir: dir,
					filename: entry.name,
					date: OC.Util.relativeModifiedDate(entry.mtime),
					size: simpleSize,
					sizeColor: sizeColor,
					icon: entry.icon
				});
				if (entry.type === 'file') {
					var urlSpec = {
						file: dir + '/' + entry.name,
					};
					var img = new Image();
					var previewUrl = OC.generateUrl('/core/preview.png?') + $.param(urlSpec);
					img.onload = function() {
						if (img.width > 5) {
							$row.find('td.filename').attr('style', 'background-image:url(' + previewUrl + ')');
						}
					};
					img.src = previewUrl;
				}
				self.$filelist.append($row);
			});

			self.$filelist.removeClass('icon-loading');
		});
	},
	/**
	 * fills the tree list with directories
	*/
	_fillSlug: function() {
		this.$dirTree.empty();
		var self = this;
		var dir;
		var path = this.$filePicker.data('path');
		var $template = $('<div data-dir="{dir}"><a>{name}</a></div>').addClass('crumb');
		if(path) {
			var paths = path.split('/');
			$.each(paths, function(index, dir) {
				dir = paths.pop();
				if(dir === '') {
					return false;
				}
				self.$dirTree.prepend($template.octemplate({
					dir: paths.join('/') + '/' + dir,
					name: dir
				}));
			});
		}
		$template.octemplate({
			dir: '',
			name: '' // Ugly but works ;)
		}, {escapeFunction: null}).prependTo(this.$dirTree);
	},
	/**
	 * handle selection made in the tree list
	*/
	_handleTreeListSelect:function(event, type) {
		var self = event.data;
		var dir = $(event.target).closest('.crumb').data('dir');
		self._fillFilePicker(dir);
		var getOcDialog = (event.target).closest('.oc-dialog');
		var buttonEnableDisable = $('.primary', getOcDialog);
		this._changeButtonsText(type, dir.split(/[/]+/).pop());
		if (this.$filePicker.data('mimetype') === "httpd/unix-directory") {
			buttonEnableDisable.prop("disabled", false);
		} else {
			buttonEnableDisable.prop("disabled", true);
		}
	},
	/**
	 * handle clicks made in the filepicker
	*/
	_handlePickerClick:function(event, $element, type) {
		var getOcDialog = this.$filePicker.closest('.oc-dialog');
		var buttonEnableDisable = getOcDialog.find('.primary');
		if ($element.data('type') === 'file') {
			if (this.$filePicker.data('multiselect') !== true || !event.ctrlKey) {
				this.$filelist.find('.filepicker_element_selected').removeClass('filepicker_element_selected');
			}
			$element.toggleClass('filepicker_element_selected');
			buttonEnableDisable.prop("disabled", false);
		} else if ( $element.data('type') === 'dir' ) {
			this._fillFilePicker(this.$filePicker.data('path') + '/' + $element.data('entryname'));
			this._changeButtonsText(type, $element.data('entryname'));
			if (this.$filePicker.data('mimetype') === "httpd/unix-directory") {
				buttonEnableDisable.prop("disabled", false);
			} else {
				buttonEnableDisable.prop("disabled", true);
			}
		}
	},

	/**
	 * Handle
	 * @param type of action
	 * @param dir on which to change buttons text
	 * @private
	 */
	_changeButtonsText: function(type, dir) {
		var copyText = dir === '' ? t('core', 'Copy') : t('core', 'Copy to {folder}', {folder: dir});
		var moveText = dir === '' ? t('core', 'Move') : t('core', 'Move to {folder}', {folder: dir});
		var buttons = $('.oc-dialog-buttonrow button');
		switch (type) {
			case this.FILEPICKER_TYPE_CHOOSE:
				break;
			case this.FILEPICKER_TYPE_COPY:
				buttons.text(copyText);
				break;
			case this.FILEPICKER_TYPE_MOVE:
				buttons.text(moveText);
				break;
			case this.FILEPICKER_TYPE_COPY_MOVE:
				buttons.eq(0).text(copyText);
				buttons.eq(1).text(moveText);
				break;
		}
	}
};


/**
 * Disable console output unless DEBUG mode is enabled.
 * Add
 *      'debug' => true,
 * To the definition of $CONFIG in config/config.php to enable debug mode.
 * The undefined checks fix the broken ie8 console
 */

/* global oc_isadmin */

var oc_debug;
var oc_webroot;

var oc_current_user = document.getElementsByTagName('head')[0].getAttribute('data-user');
var oc_requesttoken = document.getElementsByTagName('head')[0].getAttribute('data-requesttoken');

window.oc_config = window.oc_config || {};

if (typeof oc_webroot === "undefined") {
	oc_webroot = location.pathname;
	var pos = oc_webroot.indexOf('/index.php/');
	if (pos !== -1) {
		oc_webroot = oc_webroot.substr(0, pos);
	}
	else {
		oc_webroot = oc_webroot.substr(0, oc_webroot.lastIndexOf('/'));
	}
}
if (typeof console === "undefined" || typeof console.log === "undefined") {
	if (!window.console) {
		window.console = {};
	}
	var noOp = function() { };
	var methods = ['log', 'debug', 'warn', 'info', 'error', 'assert', 'time', 'timeEnd'];
	for (var i = 0; i < methods.length; i++) {
		console[methods[i]] = noOp;
	}
}

/**
* Sanitizes a HTML string by replacing all potential dangerous characters with HTML entities
* @param {string} s String to sanitize
* @return {string} Sanitized string
*/
function escapeHTML(s) {
	return s.toString().split('&').join('&amp;').split('<').join('&lt;').split('>').join('&gt;').split('"').join('&quot;').split('\'').join('&#039;');
}

/**
* Get the path to download a file
* @param {string} file The filename
* @param {string} dir The directory the file is in - e.g. $('#dir').val()
* @return {string} Path to download the file
* @deprecated use Files.getDownloadURL() instead
*/
function fileDownloadPath(dir, file) {
	return OC.filePath('files', 'ajax', 'download.php')+'?files='+encodeURIComponent(file)+'&dir='+encodeURIComponent(dir);
}

/** @namespace */
var OCP = {},
	OC = {
	PERMISSION_NONE:0,
	PERMISSION_CREATE:4,
	PERMISSION_READ:1,
	PERMISSION_UPDATE:2,
	PERMISSION_DELETE:8,
	PERMISSION_SHARE:16,
	PERMISSION_ALL:31,
	TAG_FAVORITE: '_$!<Favorite>!$_',
	/* jshint camelcase: false */
	/**
	 * Relative path to Nextcloud root.
	 * For example: "/nextcloud"
	 *
	 * @type string
	 *
	 * @deprecated since 8.2, use OC.getRootPath() instead
	 * @see OC#getRootPath
	 */
	webroot:oc_webroot,

	appswebroots:(typeof oc_appswebroots !== 'undefined') ? oc_appswebroots:false,
	/**
	 * Currently logged in user or null if none
	 *
	 * @type String
	 * @deprecated use {@link OC.getCurrentUser} instead
	 */
	currentUser:(typeof oc_current_user!=='undefined')?oc_current_user:false,
	config: window.oc_config,
	appConfig: window.oc_appconfig || {},
	theme: window.oc_defaults || {},
	coreApps:['', 'admin','log','core/search','settings','core','3rdparty'],
	requestToken: oc_requesttoken,
	menuSpeed: 50,

	/**
	 * Get an absolute url to a file in an app
	 * @param {string} app the id of the app the file belongs to
	 * @param {string} file the file path relative to the app folder
	 * @return {string} Absolute URL to a file
	 */
	linkTo:function(app,file){
		return OC.filePath(app,'',file);
	},

	/**
	 * Creates a relative url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemoteBase:function(service) {
		return OC.webroot + '/remote.php/' + service;
	},

	/**
	 * @brief Creates an absolute url for remote use
	 * @param {string} service id
	 * @return {string} the url
	 */
	linkToRemote:function(service) {
		return window.location.protocol + '//' + window.location.host + OC.linkToRemoteBase(service);
	},

	/**
	 * Gets the base path for the given OCS API service.
	 * @param {string} service name
	 * @param {int} version OCS API version
	 * @return {string} OCS API base path
	 */
	linkToOCS: function(service, version) {
		version = (version !== 2) ? 1 : 2;
		return window.location.protocol + '//' + window.location.host + OC.webroot + '/ocs/v' + version + '.php/' + service + '/';
	},

	/**
	 * Generates the absolute url for the given relative url, which can contain parameters.
	 * Parameters will be URL encoded automatically.
	 * @param {string} url
	 * @param [params] params
	 * @param [options] options
	 * @param {bool} [options.escape=true] enable/disable auto escape of placeholders (by default enabled)
	 * @return {string} Absolute URL for the given relative URL
	 */
	generateUrl: function(url, params, options) {
		var defaultOptions = {
				escape: true
			},
			allOptions = options || {};
		_.defaults(allOptions, defaultOptions);

		var _build = function (text, vars) {
			vars = vars || [];
			return text.replace(/{([^{}]*)}/g,
				function (a, b) {
					var r = (vars[b]);
					if(allOptions.escape) {
						return (typeof r === 'string' || typeof r === 'number') ? encodeURIComponent(r) : encodeURIComponent(a);
					} else {
						return (typeof r === 'string' || typeof r === 'number') ? r : a;
					}
				}
			);
		};
		if (url.charAt(0) !== '/') {
			url = '/' + url;

		}

		if(oc_config.modRewriteWorking == true) {
			return OC.webroot + _build(url, params);
		}

		return OC.webroot + '/index.php' + _build(url, params);
	},

	/**
	 * Get the absolute url for a file in an app
	 * @param {string} app the id of the app
	 * @param {string} type the type of the file to link to (e.g. css,img,ajax.template)
	 * @param {string} file the filename
	 * @return {string} Absolute URL for a file in an app
	 */
	filePath:function(app,type,file){
		var isCore=OC.coreApps.indexOf(app)!==-1,
			link=OC.webroot;
		if(file.substring(file.length-3) === 'php' && !isCore){
			link+='/index.php/apps/' + app;
			if (file != 'index.php') {
				link+='/';
				if(type){
					link+=encodeURI(type + '/');
				}
				link+= file;
			}
		}else if(file.substring(file.length-3) !== 'php' && !isCore){
			link=OC.appswebroots[app];
			if(type){
				link+= '/'+type+'/';
			}
			if(link.substring(link.length-1) !== '/'){
				link+='/';
			}
			link+=file;
		}else{
			if ((app == 'settings' || app == 'core' || app == 'search') && type == 'ajax') {
				link+='/index.php/';
			}
			else {
				link+='/';
			}
			if(!isCore){
				link+='apps/';
			}
			if (app !== '') {
				app+='/';
				link+=app;
			}
			if(type){
				link+=type+'/';
			}
			link+=file;
		}
		return link;
	},

	/**
	 * Check if a user file is allowed to be handled.
	 * @param {string} file to check
	 */
	fileIsBlacklisted: function(file) {
		return !!(file.match(oc_config.blacklist_files_regex));
	},

	/**
	 * Redirect to the target URL, can also be used for downloads.
	 * @param {string} targetURL URL to redirect to
	 */
	redirect: function(targetURL) {
		window.location = targetURL;
	},

	/**
	 * Reloads the current page
	 */
	reload: function() {
		window.location.reload();
	},

	/**
	 * Protocol that is used to access this Nextcloud instance
	 * @return {string} Used protocol
	 */
	getProtocol: function() {
		return window.location.protocol.split(':')[0];
	},

	/**
	 * Returns the host used to access this Nextcloud instance
	 * Host is sometimes the same as the hostname but now always.
	 *
	 * Examples:
	 * http://example.com => example.com
	 * https://example.com => example.com
	 * http://example.com:8080 => example.com:8080
	 *
	 * @return {string} host
	 *
	 * @since 8.2
	 */
	getHost: function() {
		return window.location.host;
	},

	/**
	 * Returns the hostname used to access this Nextcloud instance
	 * The hostname is always stripped of the port
	 *
	 * @return {string} hostname
	 * @since 9.0
	 */
	getHostName: function() {
		return window.location.hostname;
	},

	/**
	 * Returns the port number used to access this Nextcloud instance
	 *
	 * @return {int} port number
	 *
	 * @since 8.2
	 */
	getPort: function() {
		return window.location.port;
	},

	/**
	 * Returns the web root path where this Nextcloud instance
	 * is accessible, with a leading slash.
	 * For example "/nextcloud".
	 *
	 * @return {string} web root path
	 *
	 * @since 8.2
	 */
	getRootPath: function() {
		return OC.webroot;
	},

	/**
	 * Returns the currently logged in user or null if there is no logged in
	 * user (public page mode)
	 *
	 * @return {OC.CurrentUser} user spec
	 * @since 9.0.0
	 */
	getCurrentUser: function() {
		if (_.isUndefined(this._currentUserDisplayName)) {
			this._currentUserDisplayName = document.getElementsByTagName('head')[0].getAttribute('data-user-displayname');
		}
		return {
			uid: this.currentUser,
			displayName: this._currentUserDisplayName
		};
	},

	/**
	 * get the absolute path to an image file
	 * if no extension is given for the image, it will automatically decide
	 * between .png and .svg based on what the browser supports
	 * @param {string} app the app id to which the image belongs
	 * @param {string} file the name of the image file
	 * @return {string}
	 */
	imagePath:function(app,file){
		if(file.indexOf('.')==-1){//if no extension is given, use svg
			file+='.svg';
		}
		return OC.filePath(app,'img',file);
	},

	/**
	 * URI-Encodes a file path but keep the path slashes.
	 *
	 * @param path path
	 * @return encoded path
	 */
	encodePath: function(path) {
		if (!path) {
			return path;
		}
		var parts = path.split('/');
		var result = [];
		for (var i = 0; i < parts.length; i++) {
			result.push(encodeURIComponent(parts[i]));
		}
		return result.join('/');
	},

	/**
	 * Load a script for the server and load it. If the script is already loaded,
	 * the event handler will be called directly
	 * @param {string} app the app id to which the script belongs
	 * @param {string} script the filename of the script
	 * @param ready event handler to be called when the script is loaded
	 */
	addScript:function(app,script,ready){
		var deferred, path=OC.filePath(app,'js',script+'.js');
		if(!OC.addScript.loaded[path]) {
			deferred = jQuery.ajax({
				url: path,
				cache: true,
				success: function (content) {
					window.eval(content);
					if(ready) {
						ready();
					}
				}
			});
			OC.addScript.loaded[path] = deferred;
		} else {
			if (ready) {
				ready();
			}
		}
		return OC.addScript.loaded[path];
	},
	/**
	 * Loads a CSS file
	 * @param {string} app the app id to which the css style belongs
	 * @param {string} style the filename of the css file
	 */
	addStyle:function(app,style){
		var path=OC.filePath(app,'css',style+'.css');
		if(OC.addStyle.loaded.indexOf(path)===-1){
			OC.addStyle.loaded.push(path);
			if (document.createStyleSheet) {
				document.createStyleSheet(path);
			} else {
				style=$('<link rel="stylesheet" type="text/css" href="'+path+'"/>');
				$('head').append(style);
			}
		}
	},

	/**
	 * Loads translations for the given app asynchronously.
	 *
	 * @param {String} app app name
	 * @param {Function} callback callback to call after loading
	 * @return {Promise}
	 */
	addTranslations: function(app, callback) {
		return OC.L10N.load(app, callback);
	},

	/**
	 * Returns the base name of the given path.
	 * For example for "/abc/somefile.txt" it will return "somefile.txt"
	 *
	 * @param {String} path
	 * @return {String} base name
	 */
	basename: function(path) {
		return path.replace(/\\/g,'/').replace( /.*\//, '' );
	},

	/**
	 * Returns the dir name of the given path.
	 * For example for "/abc/somefile.txt" it will return "/abc"
	 *
	 * @param {String} path
	 * @return {String} dir name
	 */
	dirname: function(path) {
		return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
	},

	/**
	 * Returns whether the given paths are the same, without
	 * leading, trailing or doubled slashes and also removing
	 * the dot sections.
	 *
	 * @param {String} path1 first path
	 * @param {String} path2 second path
	 * @return {bool} true if the paths are the same
	 *
	 * @since 9.0
	 */
	isSamePath: function(path1, path2) {
		var filterDot = function(p) {
			return p !== '.';
		};
		var pathSections1 = _.filter((path1 || '').split('/'), filterDot);
		var pathSections2 = _.filter((path2 || '').split('/'), filterDot);
		path1 = OC.joinPaths.apply(OC, pathSections1);
		path2 = OC.joinPaths.apply(OC, pathSections2);
		return path1 === path2;
	},

	/**
	 * Join path sections
	 *
	 * @param {...String} path sections
	 *
	 * @return {String} joined path, any leading or trailing slash
	 * will be kept
	 *
	 * @since 8.2
	 */
	joinPaths: function() {
		if (arguments.length < 1) {
			return '';
		}
		var path = '';
		// convert to array
		var args = Array.prototype.slice.call(arguments);
		// discard empty arguments
		args = _.filter(args, function(arg) {
			return arg.length > 0;
		});
		if (args.length < 1) {
			return '';
		}

		var lastArg = args[args.length - 1];
		var leadingSlash = args[0].charAt(0) === '/';
		var trailingSlash = lastArg.charAt(lastArg.length - 1) === '/';
		var sections = [];
		var i;
		for (i = 0; i < args.length; i++) {
			sections = sections.concat(args[i].split('/'));
		}
		var first = !leadingSlash;
		for (i = 0; i < sections.length; i++) {
			if (sections[i] !== '') {
				if (first) {
					first = false;
				} else {
					path += '/';
				}
				path += sections[i];
			}
		}

		if (trailingSlash) {
			// add it back
			path += '/';
		}
		return path;
	},

	/**
	 * Do a search query and display the results
	 * @param {string} query the search query
	 */
	search: function (query) {
		OC.Search.search(query, null, 0, 30);
	},
	/**
	 * Dialog helper for jquery dialogs.
	 *
	 * @namespace OC.dialogs
	 */
	dialogs:OCdialogs,
	/**
	 * Parses a URL query string into a JS map
	 * @param {string} queryString query string in the format param1=1234&param2=abcde&param3=xyz
	 * @return {Object.<string, string>} map containing key/values matching the URL parameters
	 */
	parseQueryString:function(queryString){
		var parts,
			pos,
			components,
			result = {},
			key,
			value;
		if (!queryString){
			return null;
		}
		pos = queryString.indexOf('?');
		if (pos >= 0){
			queryString = queryString.substr(pos + 1);
		}
		parts = queryString.replace(/\+/g, '%20').split('&');
		for (var i = 0; i < parts.length; i++){
			// split on first equal sign
			var part = parts[i];
			pos = part.indexOf('=');
			if (pos >= 0) {
				components = [
					part.substr(0, pos),
					part.substr(pos + 1)
				];
			}
			else {
				// key only
				components = [part];
			}
			if (!components.length){
				continue;
			}
			key = decodeURIComponent(components[0]);
			if (!key){
				continue;
			}
			// if equal sign was there, return string
			if (components.length > 1) {
				result[key] = decodeURIComponent(components[1]);
			}
			// no equal sign => null value
			else {
				result[key] = null;
			}
		}
		return result;
	},

	/**
	 * Builds a URL query from a JS map.
	 * @param {Object.<string, string>} params map containing key/values matching the URL parameters
	 * @return {string} String containing a URL query (without question) mark
	 */
	buildQueryString: function(params) {
		if (!params) {
			return '';
		}
		return $.map(params, function(value, key) {
			var s = encodeURIComponent(key);
			if (value !== null && typeof(value) !== 'undefined') {
				s += '=' + encodeURIComponent(value);
			}
			return s;
		}).join('&');
	},

	/**
	 * Opens a popup with the setting for an app.
	 * @param {string} appid The ID of the app e.g. 'calendar', 'contacts' or 'files'.
	 * @param {boolean|string} loadJS If true 'js/settings.js' is loaded. If it's a string
	 * it will attempt to load a script by that name in the 'js' directory.
	 * @param {boolean} [cache] If true the javascript file won't be forced refreshed. Defaults to true.
	 * @param {string} [scriptName] The name of the PHP file to load. Defaults to 'settings.php' in
	 * the root of the app directory hierarchy.
	 */
	appSettings:function(args) {
		if(typeof args === 'undefined' || typeof args.appid === 'undefined') {
			throw { name: 'MissingParameter', message: 'The parameter appid is missing' };
		}
		var props = {scriptName:'settings.php', cache:true};
		$.extend(props, args);
		var settings = $('#appsettings');
		if(settings.length === 0) {
			throw { name: 'MissingDOMElement', message: 'There has be be an element with id "appsettings" for the popup to show.' };
		}
		var popup = $('#appsettings_popup');
		if(popup.length === 0) {
			$('body').prepend('<div class="popup hidden" id="appsettings_popup"></div>');
			popup = $('#appsettings_popup');
			popup.addClass(settings.hasClass('topright') ? 'topright' : 'bottomleft');
		}
		if(popup.is(':visible')) {
			popup.hide().remove();
		} else {
			var arrowclass = settings.hasClass('topright') ? 'up' : 'left';
			var jqxhr = $.get(OC.filePath(props.appid, '', props.scriptName), function(data) {
				popup.html(data).ready(function() {
					popup.prepend('<span class="arrow '+arrowclass+'"></span><h2>'+t('core', 'Settings')+'</h2><a class="close"></a>').show();
					popup.find('.close').bind('click', function() {
						popup.remove();
					});
					if(typeof props.loadJS !== 'undefined') {
						var scriptname;
						if(props.loadJS === true) {
							scriptname = 'settings.js';
						} else if(typeof props.loadJS === 'string') {
							scriptname = props.loadJS;
						} else {
							throw { name: 'InvalidParameter', message: 'The "loadJS" parameter must be either boolean or a string.' };
						}
						if(props.cache) {
							$.ajaxSetup({cache: true});
						}
						$.getScript(OC.filePath(props.appid, 'js', scriptname))
						.fail(function(jqxhr, settings, e) {
							throw e;
						});
					}
				}).show();
			}, 'html');
		}
	},

	/**
	 * For menu toggling
	 * @todo Write documentation
	 *
	 * @param {jQuery} $toggle
	 * @param {jQuery} $menuEl
	 * @param {function|undefined} toggle callback invoked everytime the menu is opened
	 * @returns {undefined}
	 */
	registerMenu: function($toggle, $menuEl, toggle) {
		var self = this;
		$menuEl.addClass('menu');
		$toggle.on('click.menu', function(event) {
			// prevent the link event (append anchor to URL)
			event.preventDefault();

			if ($menuEl.is(OC._currentMenu)) {
				self.hideMenus();
				return;
			}
			// another menu was open?
			else if (OC._currentMenu) {
				// close it
				self.hideMenus();
			}
			$menuEl.slideToggle(OC.menuSpeed, toggle);
			OC._currentMenu = $menuEl;
			OC._currentMenuToggle = $toggle;
		});
	},

	/**
	 *  @todo Write documentation
	 */
	unregisterMenu: function($toggle, $menuEl) {
		// close menu if opened
		if ($menuEl.is(OC._currentMenu)) {
			this.hideMenus();
		}
		$toggle.off('click.menu').removeClass('menutoggle');
		$menuEl.removeClass('menu');
	},

	/**
	 * Hides any open menus
	 *
	 * @param {Function} complete callback when the hiding animation is done
	 */
	hideMenus: function(complete) {
		if (OC._currentMenu) {
			var lastMenu = OC._currentMenu;
			OC._currentMenu.trigger(new $.Event('beforeHide'));
			OC._currentMenu.slideUp(OC.menuSpeed, function() {
				lastMenu.trigger(new $.Event('afterHide'));
				if (complete) {
					complete.apply(this, arguments);
				}
			});
		}
		OC._currentMenu = null;
		OC._currentMenuToggle = null;
	},

	/**
	 * Shows a given element as menu
	 *
	 * @param {Object} [$toggle=null] menu toggle
	 * @param {Object} $menuEl menu element
	 * @param {Function} complete callback when the showing animation is done
	 */
	showMenu: function($toggle, $menuEl, complete) {
		if ($menuEl.is(OC._currentMenu)) {
			return;
		}
		this.hideMenus();
		OC._currentMenu = $menuEl;
		OC._currentMenuToggle = $toggle;
		$menuEl.trigger(new $.Event('beforeShow'));
		$menuEl.show();
		$menuEl.trigger(new $.Event('afterShow'));
		// no animation
		if (_.isFunction(complete)) {
			complete();
		}
	},

	/**
	 * Wrapper for matchMedia
	 *
	 * This is makes it possible for unit tests to
	 * stub matchMedia (which doesn't work in PhantomJS)
	 * @private
	 */
	_matchMedia: function(media) {
		if (window.matchMedia) {
			return window.matchMedia(media);
		}
		return false;
	},

	/**
	 * Returns the user's locale
	 *
	 * @return {String} locale string
	 */
	getLocale: function() {
		return $('html').prop('lang');
	},

	/**
	 * Returns whether the current user is an administrator
	 *
	 * @return {bool} true if the user is an admin, false otherwise
	 * @since 9.0.0
	 */
	isUserAdmin: function() {
		return oc_isadmin;
	},

	/**
	 * Warn users that the connection to the server was lost temporarily
	 *
	 * This function is throttled to prevent stacked notfications.
	 * After 7sec the first notification is gone, then we can show another one
	 * if necessary.
	 */
	_ajaxConnectionLostHandler: _.throttle(function() {
		OC.Notification.showTemporary(t('core', 'Connection to server lost'));
	}, 7 * 1000, {trailing: false}),

	/**
	 * Process ajax error, redirects to main page
	 * if an error/auth error status was returned.
	 */
	_processAjaxError: function(xhr) {
		var self = this;
		// purposefully aborted request ?
		// this._userIsNavigatingAway needed to distinguish ajax calls cancelled by navigating away
		// from calls cancelled by failed cross-domain ajax due to SSO redirect
		if (xhr.status === 0 && (xhr.statusText === 'abort' || xhr.statusText === 'timeout' || self._reloadCalled)) {
			return;
		}

		if (_.contains([302, 303, 307, 401], xhr.status) && OC.currentUser) {
			// sometimes "beforeunload" happens later, so need to defer the reload a bit
			setTimeout(function() {
				if (!self._userIsNavigatingAway && !self._reloadCalled) {
					var timer = 0;
					var seconds = 5;
					var interval = setInterval( function() {
						OC.Notification.showUpdate(n('core', 'Problem loading page, reloading in %n second', 'Problem loading page, reloading in %n seconds', seconds - timer));
						if (timer >= seconds) {
							clearInterval(interval);
							OC.reload();
						}
						timer++;
						}, 1000 // 1 second interval
					);

					// only call reload once
					self._reloadCalled = true;
				}
			}, 100);
		} else if(xhr.status === 0) {
			// Connection lost (e.g. WiFi disconnected or server is down)
			setTimeout(function() {
				if (!self._userIsNavigatingAway && !self._reloadCalled) {
					self._ajaxConnectionLostHandler();
				}
			}, 100);
		}
	},

	/**
	 * Registers XmlHttpRequest object for global error processing.
	 *
	 * This means that if this XHR object returns 401 or session timeout errors,
	 * the current page will automatically be reloaded.
	 *
	 * @param {XMLHttpRequest} xhr
	 */
	registerXHRForErrorProcessing: function(xhr) {
		var loadCallback = function() {
			if (xhr.readyState !== 4) {
				return;
			}

			if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
				return;
			}

			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		var errorCallback = function() {
			// fire jquery global ajax error handler
			$(document).trigger(new $.Event('ajaxError'), xhr);
		};

		if (xhr.addEventListener) {
			xhr.addEventListener('load', loadCallback);
			xhr.addEventListener('error', errorCallback);
		}

	}
};

/**
 * Current user attributes
 *
 * @typedef {Object} OC.CurrentUser
 *
 * @property {String} uid user id
 * @property {String} displayName display name
 */

/**
 * @namespace OC.Plugins
 */
OC.Plugins = {
	/**
	 * @type Array.<OC.Plugin>
	 */
	_plugins: {},

	/**
	 * Register plugin
	 *
	 * @param {String} targetName app name / class name to hook into
	 * @param {OC.Plugin} plugin
	 */
	register: function(targetName, plugin) {
		var plugins = this._plugins[targetName];
		if (!plugins) {
			plugins = this._plugins[targetName] = [];
		}
		plugins.push(plugin);
	},

	/**
	 * Returns all plugin registered to the given target
	 * name / app name / class name.
	 *
	 * @param {String} targetName app name / class name to hook into
	 * @return {Array.<OC.Plugin>} array of plugins
	 */
	getPlugins: function(targetName) {
		return this._plugins[targetName] || [];
	},

	/**
	 * Call attach() on all plugins registered to the given target name.
	 *
	 * @param {String} targetName app name / class name
	 * @param {Object} object to be extended
	 * @param {Object} [options] options
	 */
	attach: function(targetName, targetObject, options) {
		var plugins = this.getPlugins(targetName);
		for (var i = 0; i < plugins.length; i++) {
			if (plugins[i].attach) {
				plugins[i].attach(targetObject, options);
			}
		}
	},

	/**
	 * Call detach() on all plugins registered to the given target name.
	 *
	 * @param {String} targetName app name / class name
	 * @param {Object} object to be extended
	 * @param {Object} [options] options
	 */
	detach: function(targetName, targetObject, options) {
		var plugins = this.getPlugins(targetName);
		for (var i = 0; i < plugins.length; i++) {
			if (plugins[i].detach) {
				plugins[i].detach(targetObject, options);
			}
		}
	},

	/**
	 * Plugin
	 *
	 * @todo make this a real class in the future
	 * @typedef {Object} OC.Plugin
	 *
	 * @property {String} name plugin name
	 * @property {Function} attach function that will be called when the
	 * plugin is attached
	 * @property {Function} [detach] function that will be called when the
	 * plugin is detached
	 */

};

/**
 * @namespace OC.search
 */
OC.search.customResults = {};
/**
 * @deprecated use get/setFormatter() instead
 */
OC.search.resultTypes = {};

OC.addStyle.loaded=[];
OC.addScript.loaded=[];

/**
 * A little class to manage a status field for a "saving" process.
 * It can be used to display a starting message (e.g. "Saving...") and then
 * replace it with a green success message or a red error message.
 *
 * @namespace OC.msg
 */
OC.msg = {
	/**
	 * Displayes a "Saving..." message in the given message placeholder
	 *
	 * @param {Object} selector	Placeholder to display the message in
	 */
	startSaving: function(selector) {
		this.startAction(selector, t('core', 'Saving...'));
	},

	/**
	 * Displayes a custom message in the given message placeholder
	 *
	 * @param {Object} selector	Placeholder to display the message in
	 * @param {string} message	Plain text message to display (no HTML allowed)
	 */
	startAction: function(selector, message) {
		$(selector).text(message)
			.removeClass('success')
			.removeClass('error')
			.stop(true, true)
			.show();
	},

	/**
	 * Displayes an success/error message in the given selector
	 *
	 * @param {Object} selector	Placeholder to display the message in
	 * @param {Object} response	Response of the server
	 * @param {Object} response.data	Data of the servers response
	 * @param {string} response.data.message	Plain text message to display (no HTML allowed)
	 * @param {string} response.status	is being used to decide whether the message
	 * is displayed as an error/success
	 */
	finishedSaving: function(selector, response) {
		this.finishedAction(selector, response);
	},

	/**
	 * Displayes an success/error message in the given selector
	 *
	 * @param {Object} selector	Placeholder to display the message in
	 * @param {Object} response	Response of the server
	 * @param {Object} response.data Data of the servers response
	 * @param {string} response.data.message Plain text message to display (no HTML allowed)
	 * @param {string} response.status is being used to decide whether the message
	 * is displayed as an error/success
	 */
	finishedAction: function(selector, response) {
		if (response.status === "success") {
			this.finishedSuccess(selector, response.data.message);
		} else {
			this.finishedError(selector, response.data.message);
		}
	},

	/**
	 * Displayes an success message in the given selector
	 *
	 * @param {Object} selector Placeholder to display the message in
	 * @param {string} message Plain text success message to display (no HTML allowed)
	 */
	finishedSuccess: function(selector, message) {
		$(selector).text(message)
			.addClass('success')
			.removeClass('error')
			.stop(true, true)
			.delay(3000)
			.fadeOut(900)
			.show();
	},

	/**
	 * Displayes an error message in the given selector
	 *
	 * @param {Object} selector Placeholder to display the message in
	 * @param {string} message Plain text error message to display (no HTML allowed)
	 */
	finishedError: function(selector, message) {
		$(selector).text(message)
			.addClass('error')
			.removeClass('success')
			.show();
	}
};

/**
 * @todo Write documentation
 * @namespace
 */
OC.Notification={
	queuedNotifications: [],
	getDefaultNotificationFunction: null,

	/**
	 * @type Array.<int> array of notification timers
	 */
	notificationTimers: [],

	/**
	 * @param callback
	 * @todo Write documentation
	 */
	setDefault: function(callback) {
		OC.Notification.getDefaultNotificationFunction = callback;
	},

	/**
	 * Hides a notification.
	 *
	 * If a row is given, only hide that one.
	 * If no row is given, hide all notifications.
	 *
	 * @param {jQuery} [$row] notification row
	 * @param {Function} [callback] callback
	 */
	hide: function($row, callback) {
		var self = this;
		var $notification = $('#notification');

		if (_.isFunction($row)) {
			// first arg is the callback
			callback = $row;
			$row = undefined;
		}

		if (!$row) {
			console.warn('Missing argument $row in OC.Notification.hide() call, caller needs to be adjusted to only dismiss its own notification');
			// assume that the row to be hidden is the first one
			$row = $notification.find('.row:first');
		}

		if ($row && $notification.find('.row').length > 1) {
			// remove the row directly
			$row.remove();
			if (callback) {
				callback.call();
			}
			return;
		}

		_.defer(function() {
			// fade out is supposed to only fade when there is a single row
			// however, some code might call hide() and show() directly after,
			// which results in more than one element
			// in this case, simply delete that one element that was supposed to
			// fade out
			//
			// FIXME: remove once all callers are adjusted to only hide their own notifications
			if ($notification.find('.row').length > 1) {
				$row.remove();
				return;
			}

			// else, fade out whatever was present
			$notification.fadeOut('400', function(){
				if (self.isHidden()) {
					if (self.getDefaultNotificationFunction) {
						self.getDefaultNotificationFunction.call();
					}
				}
				if (callback) {
					callback.call();
				}
				$notification.empty();
			});
		});
	},

	/**
	 * Shows a notification as HTML without being sanitized before.
	 * If you pass unsanitized user input this may lead to a XSS vulnerability.
	 * Consider using show() instead of showHTML()
	 *
	 * @param {string} html Message to display
	 * @param {Object} [options] options
	 * @param {string} [options.type] notification type
	 * @param {int} [options.timeout=0] timeout value, defaults to 0 (permanent)
	 * @return {jQuery} jQuery element for notification row
	 */
	showHtml: function(html, options) {
		options = options || {};
		_.defaults(options, {
			timeout: 0
		});

		var self = this;
		var $notification = $('#notification');
		if (this.isHidden()) {
			$notification.fadeIn().css('display','inline-block');
		}
		var $row = $('<div class="row"></div>');
		if (options.type) {
			$row.addClass('type-' + options.type);
		}
		if (options.type === 'error') {
			// add a close button
			var $closeButton = $('<a class="action close icon-close" href="#"></a>');
			$closeButton.attr('alt', t('core', 'Dismiss'));
			$row.append($closeButton);
			$closeButton.one('click', function() {
				self.hide($row);
				return false;
			});
			$row.addClass('closeable');
		}

		$row.prepend(html);
		$notification.append($row);

		if(options.timeout > 0) {
			// register timeout to vanish notification
			this.notificationTimers.push(setTimeout(function() {
				self.hide($row);
			}, (options.timeout * 1000)));
		}

		return $row;
	},

	/**
	 * Shows a sanitized notification
	 *
	 * @param {string} text Message to display
	 * @param {Object} [options] options
	 * @param {string} [options.type] notification type
	 * @param {int} [options.timeout=0] timeout value, defaults to 0 (permanent)
	 * @return {jQuery} jQuery element for notification row
	 */
	show: function(text, options) {
		return this.showHtml($('<div/>').text(text).html(), options);
	},

	/**
	 * Updates (replaces) a sanitized notification.
	 *
	 * @param {string} text Message to display
	 * @return {jQuery} JQuery element for notificaiton row
	 */
	showUpdate: function(text) {
		var $notification = $('#notification');
		// sanitise
		var $html = $('<div/>').text(text).html();

		// new notification
		if (text && $notification.find('.row').length == 0) {
			return this.showHtml($html);
		}

		var $row = $('<div class="row"></div>').prepend($html);

		// just update html in notification
		$notification.html($row);

		return $row;
	},

	/**
	 * Shows a notification that disappears after x seconds, default is
	 * 7 seconds
	 *
	 * @param {string} text Message to show
	 * @param {array} [options] options array
	 * @param {int} [options.timeout=7] timeout in seconds, if this is 0 it will show the message permanently
	 * @param {boolean} [options.isHTML=false] an indicator for HTML notifications (true) or text (false)
	 * @param {string} [options.type] notification type
	 */
	showTemporary: function(text, options) {
		var self = this;
		var defaults = {
			isHTML: false,
			timeout: 7
		};
		options = options || {};
		// merge defaults with passed in options
		_.defaults(options, defaults);

		var $row;
		if(options.isHTML) {
			$row = this.showHtml(text, options);
		} else {
			$row = this.show(text, options);
		}
		return $row;
	},

	/**
	 * Returns whether a notification is hidden.
	 * @return {boolean}
	 */
	isHidden: function() {
		return !$("#notification").find('.row').length;
	}
};

/**
 * Initializes core
 */
function initCore() {
	/**
	 * Disable automatic evaluation of responses for $.ajax() functions (and its
	 * higher-level alternatives like $.get() and $.post()).
	 *
	 * If a response to a $.ajax() request returns a content type of "application/javascript"
	 * JQuery would previously execute the response body. This is a pretty unexpected
	 * behaviour and can result in a bypass of our Content-Security-Policy as well as
	 * multiple unexpected XSS vectors.
	 */
	$.ajaxSetup({
		contents: {
			script: false
		}
	});

	/**
	 * Disable execution of eval in jQuery. We do require an allowed eval CSP
	 * configuration at the moment for handlebars et al. But for jQuery there is
	 * not much of a reason to execute JavaScript directly via eval.
	 *
	 * This thus mitigates some unexpected XSS vectors.
	 */
	jQuery.globalEval = function(){};

	/**
	 * Set users locale to moment.js as soon as possible
	 */
	moment.locale(OC.getLocale());

	var userAgent = window.navigator.userAgent;
	var msie = userAgent.indexOf('MSIE ');
	var trident = userAgent.indexOf('Trident/');
	var edge = userAgent.indexOf('Edge/');

	if (msie > 0 || trident > 0) {
		// (IE 10 or older) || IE 11
		$('html').addClass('ie');
	} else if (edge > 0) {
		// for edge
		$('html').addClass('edge');
	}

	$(window).on('unload.main', function() {
		OC._unloadCalled = true;
	});
	$(window).on('beforeunload.main', function() {
		// super-trick thanks to http://stackoverflow.com/a/4651049
		// in case another handler displays a confirmation dialog (ex: navigating away
		// during an upload), there are two possible outcomes: user clicked "ok" or
		// "cancel"

		// first timeout handler is called after unload dialog is closed
		setTimeout(function() {
			OC._userIsNavigatingAway = true;

			// second timeout event is only called if user cancelled (Chrome),
			// but in other browsers it might still be triggered, so need to
			// set a higher delay...
			setTimeout(function() {
				if (!OC._unloadCalled) {
					OC._userIsNavigatingAway = false;
				}
			}, 10000);
		},1);
	});
	$(document).on('ajaxError.main', function( event, request, settings ) {
		if (settings && settings.allowAuthErrors) {
			return;
		}
		OC._processAjaxError(request);
	});

	/**
	 * Calls the server periodically to ensure that session doesn't
	 * time out
	 */
	function initSessionHeartBeat(){
		// max interval in seconds set to 24 hours
		var maxInterval = 24 * 3600;
		// interval in seconds
		var interval = 900;
		if (oc_config.session_lifetime) {
			interval = Math.floor(oc_config.session_lifetime / 2);
		}
		// minimum one minute
		if (interval < 60) {
			interval = 60;
		}
		if (interval > maxInterval) {
			interval = maxInterval;
		}
		var url = OC.generateUrl('/heartbeat');
		var heartBeatTimeout = null;
		var heartBeat = function() {
			clearInterval(heartBeatTimeout);
			heartBeatTimeout = setInterval(function() {
				$.post(url);
			}, interval * 1000);
		};
		$(document).ajaxComplete(heartBeat);
		heartBeat();
	}

	// session heartbeat (defaults to enabled)
	if (typeof(oc_config.session_keepalive) === 'undefined' ||
		!!oc_config.session_keepalive) {

		initSessionHeartBeat();
	}

	OC.registerMenu($('#expand'), $('#expanddiv'));

	// toggle for menus
	$(document).on('mouseup.closemenus', function(event) {
		var $el = $(event.target);
		if ($el.closest('.menu').length || $el.closest('.menutoggle').length) {
			// don't close when clicking on the menu directly or a menu toggle
			return false;
		}

		OC.hideMenus();
	});

	/**
	 * Set up the main menu toggle to react to media query changes.
	 * If the screen is small enough, the main menu becomes a toggle.
	 * If the screen is bigger, the main menu is not a toggle any more.
	 */
	function setupMainMenu() {

		// init the more-apps menu
		OC.registerMenu($('#more-apps'), $('#navigation'));

		// toggle the navigation
		var $toggle = $('#header .header-appname-container');
		var $navigation = $('#navigation');
		var $appmenu = $('#appmenu');

		// init the menu
		OC.registerMenu($toggle, $navigation);
		$toggle.data('oldhref', $toggle.attr('href'));
		$toggle.attr('href', '#');
		$navigation.hide();

		// show loading feedback
		$navigation.delegate('a', 'click', function(event) {
			var $app = $(event.target);
			if(!$app.is('a')) {
				$app = $app.closest('a');
			}
			if(event.which === 1 && !event.ctrlKey && !event.metaKey) {
				$app.addClass('app-loading');
			} else {
				// Close navigation when opening app in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});

		$navigation.delegate('a', 'mouseup', function(event) {
			if(event.which === 2) {
				// Close navigation when opening app in
				// a new tab via middle click
				OC.hideMenus(function(){return false;});
			}
		});

		$appmenu.delegate('a', 'click', function(event) {
			var $app = $(event.target);
			if(!$app.is('a')) {
				$app = $app.closest('a');
			}
			if(event.which === 1 && !event.ctrlKey && !event.metaKey) {
				$app.addClass('app-loading');
			} else {
				// Close navigation when opening app in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});
	}

	function setupUserMenu() {
		var $menu = $('#header #settings');

		// show loading feedback
		$menu.delegate('a', 'click', function(event) {
			var $page = $(event.target);
			if (!$page.is('a')) {
				$page = $page.closest('a');
			}
			if(event.which === 1 && !event.ctrlKey && !event.metaKey) {
				$page.find('img').remove();
				$page.find('div').remove(); // prevent odd double-clicks
				$page.prepend($('<div/>').addClass('icon-loading-small-dark'));
			} else {
				// Close navigation when opening menu entry in
				// a new tab
				OC.hideMenus(function(){return false;});
			}
		});

		$menu.delegate('a', 'mouseup', function(event) {
			if(event.which === 2) {
				// Close navigation when opening app in
				// a new tab via middle click
				OC.hideMenus(function(){return false;});
			}
		});
	}

	function setupContactsMenu() {
		new OC.ContactsMenu({
			el: $('#contactsmenu .menu'),
			trigger: $('#contactsmenu .menutoggle')
		});
	}

	setupMainMenu();
	setupUserMenu();
	setupContactsMenu();

	// move triangle of apps dropdown to align with app name triangle
	// 2 is the additional offset between the triangles
	if($('#navigation').length) {
		$('#header #nextcloud + .menutoggle').on('click', function(){
			$('#menu-css-helper').remove();
			var caretPosition = $('.header-appname + .icon-caret').offset().left - 2;
			if(caretPosition > 255) {
				// if the app name is longer than the menu, just put the triangle in the middle
				return;
			} else {
				$('head').append('<style id="menu-css-helper">#navigation:after { left: '+ caretPosition +'px; }</style>');
			}
		});
		$('#header #appmenu .menutoggle').on('click', function() {
			$('#appmenu').toggleClass('menu-open');
			if($('#appmenu').is(':visible')) {
				$('#menu-css-helper').remove();
			}
		});
	}

	var resizeMenu = function() {
		var appList = $('#appmenu li');
		var headerWidth = $('.header-left').width() - $('#nextcloud').width();
		var usePercentualAppMenuLimit = 0.33;
		var minAppsDesktop = 8;
		var availableWidth = headerWidth - $(appList).width();
		var isMobile = $(window).width() < 768;
		if (!isMobile) {
			availableWidth = headerWidth * usePercentualAppMenuLimit;
		}
		var appCount = Math.floor((availableWidth / $(appList).width()));
		if (isMobile && appCount > minAppsDesktop) {
			appCount = minAppsDesktop;
		}
		if (!isMobile && appCount < minAppsDesktop) {
			appCount = minAppsDesktop;
		}

		// show at least 2 apps in the popover
		if(appList.length-1-appCount >= 1) {
			appCount--;
		}
		// show at least one icon
		if(appCount < 1) {
			appCount = 1;
		}

		$('#more-apps a').removeClass('active');
		var lastShownApp;
		for (var k = 0; k < appList.length-1; k++) {
			var name = $(appList[k]).data('id');
			if(k < appCount) {
				$(appList[k]).removeClass('hidden');
				$('#apps li[data-id=' + name + ']').addClass('in-header');
				lastShownApp = appList[k];
			} else {
				$(appList[k]).addClass('hidden');
				$('#apps li[data-id=' + name + ']').removeClass('in-header');
				// move active app to last position if it is active
				if(appCount > 0 && $(appList[k]).children('a').hasClass('active')) {
					$(lastShownApp).addClass('hidden');
					$('#apps li[data-id=' + $(lastShownApp).data('id') + ']').removeClass('in-header');
					$(appList[k]).removeClass('hidden');
					$('#apps li[data-id=' + name + ']').addClass('in-header');
				}
			}
		}

		// show/hide more apps icon
		if($('#apps li:not(.in-header)').length === 0) {
			$('#more-apps').hide();
			$('#navigation').hide();
		} else {
			$('#more-apps').show();
		}
	};
	$(window).resize(resizeMenu);
	resizeMenu();

	// just add snapper for logged in users
	if($('#app-navigation').length && !$('html').hasClass('lte9')) {

		// App sidebar on mobile
		var snapper = new Snap({
			element: document.getElementById('app-content'),
			disable: 'right',
			maxPosition: 250,
			minDragDistance: 100
		});
		$('#app-content').prepend('<div id="app-navigation-toggle" class="icon-menu" style="display:none;"></div>');
		$('#app-navigation-toggle').click(function(){
			if(snapper.state().state == 'left'){
				snapper.close();
			} else {
				snapper.open('left');
			}
		});
		// close sidebar when switching navigation entry
		var $appNavigation = $('#app-navigation');
		$appNavigation.delegate('a, :button', 'click', function(event) {
			var $target = $(event.target);
			// don't hide navigation when changing settings or adding things
			if($target.is('.app-navigation-noclose') ||
				$target.closest('.app-navigation-noclose').length) {
				return;
			}
			if($target.is('.app-navigation-entry-utils-menu-button') ||
				$target.closest('.app-navigation-entry-utils-menu-button').length) {
				return;
			}
			if($target.is('.add-new') ||
				$target.closest('.add-new').length) {
				return;
			}
			if($target.is('#app-settings') ||
				$target.closest('#app-settings').length) {
				return;
			}
			snapper.close();
		});

		var navigationBarSlideGestureEnabled = false;
		var navigationBarSlideGestureAllowed = true;
		var navigationBarSlideGestureEnablePending = false;

		OC.allowNavigationBarSlideGesture = function() {
			navigationBarSlideGestureAllowed = true;

			if (navigationBarSlideGestureEnablePending) {
				snapper.enable();

				navigationBarSlideGestureEnabled = true;
				navigationBarSlideGestureEnablePending = false;
			}
		};

		OC.disallowNavigationBarSlideGesture = function() {
			navigationBarSlideGestureAllowed = false;

			if (navigationBarSlideGestureEnabled) {
				var endCurrentDrag = true;
				snapper.disable(endCurrentDrag);

				navigationBarSlideGestureEnabled = false;
				navigationBarSlideGestureEnablePending = true;
			}
		};

		var toggleSnapperOnSize = function() {
			if($(window).width() > 768) {
				snapper.close();
				snapper.disable();

				navigationBarSlideGestureEnabled = false;
				navigationBarSlideGestureEnablePending = false;
			} else if (navigationBarSlideGestureAllowed) {
				snapper.enable();

				navigationBarSlideGestureEnabled = true;
				navigationBarSlideGestureEnablePending = false;
			} else {
				navigationBarSlideGestureEnablePending = true;
			}
		};

		$(window).resize(_.debounce(toggleSnapperOnSize, 250));

		// initial call
		toggleSnapperOnSize();

	}

	// Update live timestamps every 30 seconds
	setInterval(function() {
		$('.live-relative-timestamp').each(function() {
			$(this).text(OC.Util.relativeModifiedDate(parseInt($(this).attr('data-timestamp'), 10)));
		});
	}, 30 * 1000);

	OC.PasswordConfirmation.init();
}

OC.PasswordConfirmation = {
	callback: null,
	pageLoadTime: null,
	init: function() {
		$('.password-confirm-required').on('click', _.bind(this.requirePasswordConfirmation, this));
		this.pageLoadTime = moment.now();
	},

	requiresPasswordConfirmation: function() {
		var serverTimeDiff = this.pageLoadTime - (nc_pageLoad * 1000);
		var timeSinceLogin = moment.now() - (serverTimeDiff + (nc_lastLogin * 1000));
		
		// if timeSinceLogin > 30 minutes and user backend allows password confirmation
		return (backendAllowsPasswordConfirmation && timeSinceLogin > 30 * 60 * 1000);
	},

	/**
	 * @param {function} callback
	 */
	requirePasswordConfirmation: function(callback) {
		var self = this;

		if (this.requiresPasswordConfirmation()) {
			OC.dialogs.prompt(
				t(
					'core',
					'This action requires you to confirm your password'
				),
				t('core','Authentication required'),
				function (result, password) {
					if (result && password !== '') {
						self._confirmPassword(password);
					}
				},
				true,
				t('core','Password'),
				true
			).then(function() {
				var $dialog = $('.oc-dialog:visible');
				$dialog.find('.ui-icon').remove();

				var $buttons = $dialog.find('button');
				$buttons.eq(0).text(t('core', 'Cancel'));
				$buttons.eq(1).text(t('core', 'Confirm'));
			});
		}

		this.callback = callback;
	},

	_confirmPassword: function(password) {
		var self = this;

		$.ajax({
			url: OC.generateUrl('/login/confirm'),
			data: {
				password: password
			},
			type: 'POST',
			success: function(response) {
				nc_lastLogin = response.lastLogin;

				if (_.isFunction(self.callback)) {
					self.callback();
				}
			},
			error: function() {
				OC.PasswordConfirmation.requirePasswordConfirmation(self.callback);
				OC.Notification.showTemporary(t('core', 'Failed to authenticate, try again'));
			}
		});
	}
};

$(document).ready(initCore);

/**
 * Filter Jquery selector by attribute value
 */
$.fn.filterAttr = function(attr_name, attr_value) {
	return this.filter(function() { return $(this).attr(attr_name) === attr_value; });
};

/**
 * Returns a human readable file size
 * @param {number} size Size in bytes
 * @param {boolean} skipSmallSizes return '< 1 kB' for small files
 * @return {string}
 */
function humanFileSize(size, skipSmallSizes) {
	var humanList = ['B', 'KB', 'MB', 'GB', 'TB'];
	// Calculate Log with base 1024: size = 1024 ** order
	var order = size > 0 ? Math.floor(Math.log(size) / Math.log(1024)) : 0;
	// Stay in range of the byte sizes that are defined
	order = Math.min(humanList.length - 1, order);
	var readableFormat = humanList[order];
	var relativeSize = (size / Math.pow(1024, order)).toFixed(1);
	if(skipSmallSizes === true && order === 0) {
		if(relativeSize !== "0.0"){
			return '< 1 KB';
		} else {
			return '0 KB';
		}
	}
	if(order < 2){
		relativeSize = parseFloat(relativeSize).toFixed(0);
	}
	else if(relativeSize.substr(relativeSize.length-2,2)==='.0'){
		relativeSize=relativeSize.substr(0,relativeSize.length-2);
	}
	return relativeSize + ' ' + readableFormat;
}

/**
 * Format an UNIX timestamp to a human understandable format
 * @param {number} timestamp UNIX timestamp
 * @return {string} Human readable format
 */
function formatDate(timestamp){
	return OC.Util.formatDate(timestamp);
}

//
/**
 * Get the value of a URL parameter
 * @link http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
 * @param {string} name URL parameter
 * @return {string}
 */
function getURLParameter(name) {
	return decodeURIComponent(
		(new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(
			location.search)||[,''])[1].replace(/\+/g, '%20')
		)||'';
}

/**
 * Takes an absolute timestamp and return a string with a human-friendly relative date
 * @param {number} timestamp A Unix timestamp
 */
function relative_modified_date(timestamp) {
	/*
	 Were multiplying by 1000 to bring the timestamp back to its original value
	 per https://github.com/owncloud/core/pull/10647#discussion_r16790315
	  */
	return OC.Util.relativeModifiedDate(timestamp * 1000);
}

/**
 * Utility functions
 * @namespace
 */
OC.Util = {
	// TODO: remove original functions from global namespace
	humanFileSize: humanFileSize,

	/**
	 * Returns a file size in bytes from a humanly readable string
	 * Makes 2kB to 2048.
	 * Inspired by computerFileSize in helper.php
	 * @param  {string} string file size in human readable format
	 * @return {number} or null if string could not be parsed
	 *
	 *
	 */
	computerFileSize: function (string) {
		if (typeof string !== 'string') {
			return null;
		}

		var s = string.toLowerCase().trim();
		var bytes = null;

		var bytesArray = {
			'b' : 1,
			'k' : 1024,
			'kb': 1024,
			'mb': 1024 * 1024,
			'm' : 1024 * 1024,
			'gb': 1024 * 1024 * 1024,
			'g' : 1024 * 1024 * 1024,
			'tb': 1024 * 1024 * 1024 * 1024,
			't' : 1024 * 1024 * 1024 * 1024,
			'pb': 1024 * 1024 * 1024 * 1024 * 1024,
			'p' : 1024 * 1024 * 1024 * 1024 * 1024
		};

		var matches = s.match(/^[\s+]?([0-9]*)(\.([0-9]+))?( +)?([kmgtp]?b?)$/i);
		if (matches !== null) {
			bytes = parseFloat(s);
			if (!isFinite(bytes)) {
				return null;
			}
		} else {
			return null;
		}
		if (matches[5]) {
			bytes = bytes * bytesArray[matches[5]];
		}

		bytes = Math.round(bytes);
		return bytes;
	},

	/**
	 * @param timestamp
	 * @param format
	 * @returns {string} timestamp formatted as requested
	 */
	formatDate: function (timestamp, format) {
		format = format || "LLL";
		return moment(timestamp).format(format);
	},

	/**
	 * @param timestamp
	 * @returns {string} human readable difference from now
	 */
	relativeModifiedDate: function (timestamp) {
		var diff = moment().diff(moment(timestamp));
		if (diff >= 0 && diff < 45000 ) {
			return t('core', 'seconds ago');
		}
		return moment(timestamp).fromNow();
	},
	/**
	 * Returns whether the browser supports SVG
	 * @deprecated SVG is always supported (since 9.0)
	 * @return {boolean} true if the browser supports SVG, false otherwise
	 */
	hasSVGSupport: function(){
		return true;
	},
	/**
	 * If SVG is not supported, replaces the given icon's extension
	 * from ".svg" to ".png".
	 * If SVG is supported, return the image path as is.
	 * @param {string} file image path with svg extension
	 * @deprecated SVG is always supported (since 9.0)
	 * @return {string} fixed image path with png extension if SVG is not supported
	 */
	replaceSVGIcon: function(file) {
		return file;
	},
	/**
	 * Replace SVG images in all elements that have the "svg" class set
	 * with PNG images.
	 *
	 * @param $el root element from which to search, defaults to $('body')
	 * @deprecated SVG is always supported (since 9.0)
	 */
	replaceSVG: function($el) {},

	/**
	 * Fix image scaling for IE8, since background-size is not supported.
	 *
	 * This scales the image to the element's actual size, the URL is
	 * taken from the "background-image" CSS attribute.
	 *
	 * @deprecated IE8 isn't supported since 9.0
	 * @param {Object} $el image element
	 */
	scaleFixForIE8: function($el) {},

	/**
	 * Returns whether this is IE
	 *
	 * @return {bool} true if this is IE, false otherwise
	 */
	isIE: function() {
		return $('html').hasClass('ie');
	},

	/**
	 * Returns whether this is IE8
	 *
	 * @deprecated IE8 isn't supported since 9.0
	 * @return {bool} false (IE8 isn't supported anymore)
	 */
	isIE8: function() {
		return false;
	},

	/**
	 * Returns the width of a generic browser scrollbar
	 *
	 * @return {int} width of scrollbar
	 */
	getScrollBarWidth: function() {
		if (this._scrollBarWidth) {
			return this._scrollBarWidth;
		}

		var inner = document.createElement('p');
		inner.style.width = "100%";
		inner.style.height = "200px";

		var outer = document.createElement('div');
		outer.style.position = "absolute";
		outer.style.top = "0px";
		outer.style.left = "0px";
		outer.style.visibility = "hidden";
		outer.style.width = "200px";
		outer.style.height = "150px";
		outer.style.overflow = "hidden";
		outer.appendChild (inner);

		document.body.appendChild (outer);
		var w1 = inner.offsetWidth;
		outer.style.overflow = 'scroll';
		var w2 = inner.offsetWidth;
		if(w1 === w2) {
			w2 = outer.clientWidth;
		}

		document.body.removeChild (outer);

		this._scrollBarWidth = (w1 - w2);

		return this._scrollBarWidth;
	},

	/**
	 * Remove the time component from a given date
	 *
	 * @param {Date} date date
	 * @return {Date} date with stripped time
	 */
	stripTime: function(date) {
		// FIXME: likely to break when crossing DST
		// would be better to use a library like momentJS
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	},

	_chunkify: function(t) {
		// Adapted from http://my.opera.com/GreyWyvern/blog/show.dml/1671288
		var tz = [], x = 0, y = -1, n = 0, code, c;

		while (x < t.length) {
			c = t.charAt(x);
			// only include the dot in strings
			var m = ((!n && c === '.') || (c >= '0' && c <= '9'));
			if (m !== n) {
				// next chunk
				y++;
				tz[y] = '';
				n = m;
			}
			tz[y] += c;
			x++;
		}
		return tz;
	},
	/**
	 * Compare two strings to provide a natural sort
	 * @param a first string to compare
	 * @param b second string to compare
	 * @return -1 if b comes before a, 1 if a comes before b
	 * or 0 if the strings are identical
	 */
	naturalSortCompare: function(a, b) {
		var x;
		var aa = OC.Util._chunkify(a);
		var bb = OC.Util._chunkify(b);

		for (x = 0; aa[x] && bb[x]; x++) {
			if (aa[x] !== bb[x]) {
				var aNum = Number(aa[x]), bNum = Number(bb[x]);
				// note: == is correct here
				if (aNum == aa[x] && bNum == bb[x]) {
					return aNum - bNum;
				} else {
					// Forcing 'en' locale to match the server-side locale which is
					// always 'en'.
					//
					// Note: This setting isn't supported by all browsers but for the ones
					// that do there will be more consistency between client-server sorting
					return aa[x].localeCompare(bb[x], 'en');
				}
			}
		}
		return aa.length - bb.length;
	},
	/**
	 * Calls the callback in a given interval until it returns true
	 * @param {function} callback
	 * @param {integer} interval in milliseconds
	 */
	waitFor: function(callback, interval) {
		var internalCallback = function() {
			if(callback() !== true) {
				setTimeout(internalCallback, interval);
			}
		};

		internalCallback();
	},
	/**
	 * Checks if a cookie with the given name is present and is set to the provided value.
	 * @param {string} name name of the cookie
	 * @param {string} value value of the cookie
	 * @return {boolean} true if the cookie with the given name has the given value
	 */
	isCookieSetToValue: function(name, value) {
		var cookies = document.cookie.split(';');
		for (var i=0; i < cookies.length; i++) {
			var cookie = cookies[i].split('=');
			if (cookie[0].trim() === name && cookie[1].trim() === value) {
				return true;
			}
		}
		return false;
	}
};

/**
 * Utility class for the history API,
 * includes fallback to using the URL hash when
 * the browser doesn't support the history API.
 *
 * @namespace
 */
OC.Util.History = {
	_handlers: [],

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param {Object|string} params to append to the URL, can be either a string
	 * or a map
	 * @param {string} [url] URL to be used, otherwise the current URL will be used,
	 * using the params as query string
	 * @param {boolean} [replace=false] whether to replace instead of pushing
	 */
	_pushState: function(params, url, replace) {
		var strParams;
		if (typeof(params) === 'string') {
			strParams = params;
		}
		else {
			strParams = OC.buildQueryString(params);
		}
		if (window.history.pushState) {
			url = url || location.pathname + '?' + strParams;
			// Workaround for bug with SVG and window.history.pushState on Firefox < 51
			// https://bugzilla.mozilla.org/show_bug.cgi?id=652991
			var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
			if (isFirefox && parseInt(navigator.userAgent.split('/').pop()) < 51) {
				var patterns = document.querySelectorAll('[fill^="url(#"], [stroke^="url(#"], [filter^="url(#invert"]');
				for (var i = 0, ii = patterns.length, pattern; i < ii; i++) {
					pattern = patterns[i];
					pattern.style.fill = pattern.style.fill;
					pattern.style.stroke = pattern.style.stroke;
					pattern.removeAttribute("filter");
					pattern.setAttribute("filter", "url(#invert)");
				}
			}
			if (replace) {
				window.history.replaceState(params, '', url);
			} else {
				window.history.pushState(params, '', url);
			}
		}
		// use URL hash for IE8
		else {
			window.location.hash = '?' + strParams;
			// inhibit next onhashchange that just added itself
			// to the event queue
			this._cancelPop = true;
		}
	},

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param {Object|string} params to append to the URL, can be either a string
	 * or a map
	 * @param {string} [url] URL to be used, otherwise the current URL will be used,
	 * using the params as query string
	 */
	pushState: function(params, url) {
		return this._pushState(params, url, false);
	},

	/**
	 * Push the current URL parameters to the history stack
	 * and change the visible URL.
	 * Note: this includes a workaround for IE8/IE9 that uses
	 * the hash part instead of the search part.
	 *
	 * @param {Object|string} params to append to the URL, can be either a string
	 * or a map
	 * @param {string} [url] URL to be used, otherwise the current URL will be used,
	 * using the params as query string
	 */
	replaceState: function(params, url) {
		return this._pushState(params, url, true);
	},

	/**
	 * Add a popstate handler
	 *
	 * @param handler function
	 */
	addOnPopStateHandler: function(handler) {
		this._handlers.push(handler);
	},

	/**
	 * Parse a query string from the hash part of the URL.
	 * (workaround for IE8 / IE9)
	 */
	_parseHashQuery: function() {
		var hash = window.location.hash,
			pos = hash.indexOf('?');
		if (pos >= 0) {
			return hash.substr(pos + 1);
		}
		if (hash.length) {
			// remove hash sign
			return hash.substr(1);
		}
		return '';
	},

	_decodeQuery: function(query) {
		return query.replace(/\+/g, ' ');
	},

	/**
	 * Parse the query/search part of the URL.
	 * Also try and parse it from the URL hash (for IE8)
	 *
	 * @return map of parameters
	 */
	parseUrlQuery: function() {
		var query = this._parseHashQuery(),
			params;
		// try and parse from URL hash first
		if (query) {
			params = OC.parseQueryString(this._decodeQuery(query));
		}
		// else read from query attributes
		params = _.extend(params || {}, OC.parseQueryString(this._decodeQuery(location.search)));
		return params || {};
	},

	_onPopState: function(e) {
		if (this._cancelPop) {
			this._cancelPop = false;
			return;
		}
		var params;
		if (!this._handlers.length) {
			return;
		}
		params = (e && e.state);
		if (_.isString(params)) {
			params = OC.parseQueryString(params);
		} else if (!params) {
			params = this.parseUrlQuery() || {};
		}
		for (var i = 0; i < this._handlers.length; i++) {
			this._handlers[i](params);
		}
	}
};

// fallback to hashchange when no history support
if (window.history.pushState) {
	window.onpopstate = _.bind(OC.Util.History._onPopState, OC.Util.History);
}
else {
	$(window).on('hashchange', _.bind(OC.Util.History._onPopState, OC.Util.History));
}

/**
 * Get a variable by name
 * @param {string} name
 * @return {*}
 */
OC.get=function(name) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context=window;

	for(var i = 0; i < namespaces.length; i++) {
		context = context[namespaces[i]];
		if(!context){
			return false;
		}
	}
	return context[tail];
};

/**
 * Set a variable by name
 * @param {string} name
 * @param {*} value
 */
OC.set=function(name, value) {
	var namespaces = name.split(".");
	var tail = namespaces.pop();
	var context=window;

	for(var i = 0; i < namespaces.length; i++) {
		if(!context[namespaces[i]]){
			context[namespaces[i]]={};
		}
		context = context[namespaces[i]];
	}
	context[tail]=value;
};

// fix device width on windows phone
(function() {
	if ("-ms-user-select" in document.documentElement.style && navigator.userAgent.match(/IEMobile\/10\.0/)) {
		var msViewportStyle = document.createElement("style");
		msViewportStyle.appendChild(
			document.createTextNode("@-ms-viewport{width:auto!important}")
		);
		document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
	}
})();

/**
 * Namespace for apps
 * @namespace OCA
 */
window.OCA = {};

/**
 * select a range in an input field
 * @link http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
 * @param {type} start
 * @param {type} end
 */
jQuery.fn.selectRange = function(start, end) {
	return this.each(function() {
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else if (this.createTextRange) {
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', end);
			range.moveStart('character', start);
			range.select();
		}
	});
};

/**
 * check if an element exists.
 * allows you to write if ($('#myid').exists()) to increase readability
 * @link http://stackoverflow.com/questions/31044/is-there-an-exists-function-for-jquery
 */
jQuery.fn.exists = function(){
	return this.length > 0;
};

/**
 * @deprecated use OC.Util.getScrollBarWidth() instead
 */
function getScrollBarWidth() {
	return OC.Util.getScrollBarWidth();
}

/**
 * jQuery tipsy shim for the bootstrap tooltip
 */
jQuery.fn.tipsy = function(argument) {
	console.warn('Deprecation warning: tipsy is deprecated. Use tooltip instead.');
	if(typeof argument === 'object' && argument !== null) {

		// tipsy defaults
		var options = {
			placement: 'bottom',
			delay: { 'show': 0, 'hide': 0},
			trigger: 'hover',
			html: false,
			container: 'body'
		};
		if(argument.gravity) {
			switch(argument.gravity) {
				case 'n':
				case 'nw':
				case 'ne':
					options.placement='bottom';
					break;
				case 's':
				case 'sw':
				case 'se':
					options.placement='top';
					break;
				case 'w':
					options.placement='right';
					break;
				case 'e':
					options.placement='left';
					break;
			}
		}
		if(argument.trigger) {
			options.trigger = argument.trigger;
		}
		if(argument.delayIn) {
			options.delay.show = argument.delayIn;
		}
		if(argument.delayOut) {
			options.delay.hide = argument.delayOut;
		}
		if(argument.html) {
			options.html = true;
		}
		if(argument.fallback) {
			options.title = argument.fallback;
		}
		// destroy old tooltip in case the title has changed
		jQuery.fn.tooltip.call(this, 'destroy');
		jQuery.fn.tooltip.call(this, options);
	} else {
		this.tooltip(argument);
		jQuery.fn.tooltip.call(this, argument);
	}
	return this;
};


/**
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/**
 * L10N namespace with localization functions.
 *
 * @namespace
 */
OC.L10N = {
	/**
	 * String bundles with app name as key.
	 * @type {Object.<String,String>}
	 */
	_bundles: {},

	/**
	 * Plural functions, key is app name and value is function.
	 * @type {Object.<String,Function>}
	 */
	_pluralFunctions: {},

	/**
	 * Load an app's translation bundle if not loaded already.
	 *
	 * @param {String} appName name of the app
	 * @param {Function} callback callback to be called when
	 * the translations are loaded
	 * @return {Promise} promise
	 */
	load: function(appName, callback) {
		// already available ?
		if (this._bundles[appName] || OC.getLocale() === 'en') {
			var deferred = $.Deferred();
			var promise = deferred.promise();
			promise.then(callback);
			deferred.resolve();
			return promise;
		}

		var self = this;
		var url = OC.filePath(appName, 'l10n', OC.getLocale() + '.json');

		// load JSON translation bundle per AJAX
		return $.get(url)
			.then(
				function(result) {
					if (result.translations) {
						self.register(appName, result.translations, result.pluralForm);
					}
				})
			.then(callback);
	},

	/**
	 * Register an app's translation bundle.
	 *
	 * @param {String} appName name of the app
	 * @param {Object<String,String>} bundle
	 * @param {Function|String} [pluralForm] optional plural function or plural string
	 */
	register: function(appName, bundle, pluralForm) {
		var self = this;
		if (_.isUndefined(this._bundles[appName])) {
			this._bundles[appName] = bundle || {};

			if (_.isFunction(pluralForm)) {
				this._pluralFunctions[appName] = pluralForm;
			} else {
				// generate plural function based on form
				this._pluralFunctions[appName] = this._generatePluralFunction(pluralForm);
			}
		} else {
			// Theme overwriting the default language
			_.extend(self._bundles[appName], bundle);
		}
	},

	/**
	 * Generates a plural function based on the given plural form.
	 * If an invalid form has been given, returns a default function.
	 *
	 * @param {String} pluralForm plural form
	 */
	_generatePluralFunction: function(pluralForm) {
		// default func
		var func = function (n) {
			var p = (n !== 1) ? 1 : 0;
			return { 'nplural' : 2, 'plural' : p };
		};

		if (!pluralForm) {
			console.warn('Missing plural form in language file');
			return func;
		}

		/**
		 * code below has been taken from jsgettext - which is LGPL licensed
		 * https://developer.berlios.de/projects/jsgettext/
		 * http://cvs.berlios.de/cgi-bin/viewcvs.cgi/jsgettext/jsgettext/lib/Gettext.js
		 */
		var pf_re = new RegExp('^(\\s*nplurals\\s*=\\s*[0-9]+\\s*;\\s*plural\\s*=\\s*(?:\\s|[-\\?\\|&=!<>+*/%:;a-zA-Z0-9_\\(\\)])+)', 'm');
		if (pf_re.test(pluralForm)) {
			//ex english: "Plural-Forms: nplurals=2; plural=(n != 1);\n"
			//pf = "nplurals=2; plural=(n != 1);";
			//ex russian: nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10< =4 && (n%100<10 or n%100>=20) ? 1 : 2)
			//pf = "nplurals=3; plural=(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2)";
			var pf = pluralForm;
			if (! /;\s*$/.test(pf)) {
				pf = pf.concat(';');
			}
			/* We used to use eval, but it seems IE has issues with it.
			 * We now use "new Function", though it carries a slightly
			 * bigger performance hit.
			var code = 'function (n) { var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) }; };';
			Gettext._locale_data[domain].head.plural_func = eval("("+code+")");
			 */
			var code = 'var plural; var nplurals; '+pf+' return { "nplural" : nplurals, "plural" : (plural === true ? 1 : plural ? plural : 0) };';
			func = new Function("n", code);
		} else {
			console.warn('Invalid plural form in language file: "' + pluralForm + '"');
		}
		return func;
	},

	/**
	 * Translate a string
	 * @param {string} app the id of the app for which to translate the string
	 * @param {string} text the string to translate
	 * @param [vars] map of placeholder key to value
	 * @param {number} [count] number to replace %n with
	 * @param {array} [options] options array
	 * @param {bool} [options.escape=true] enable/disable auto escape of placeholders (by default enabled)
	 * @return {string}
	 */
	translate: function(app, text, vars, count, options) {
		var defaultOptions = {
				escape: true
			},
			allOptions = options || {};
		_.defaults(allOptions, defaultOptions);

		// TODO: cache this function to avoid inline recreation
		// of the same function over and over again in case
		// translate() is used in a loop
		var _build = function (text, vars, count) {
			return text.replace(/%n/g, count).replace(/{([^{}]*)}/g,
				function (a, b) {
					var r = vars[b];
					if(typeof r === 'string' || typeof r === 'number') {
						if(allOptions.escape) {
							return DOMPurify.sanitize(escapeHTML(r));
						} else {
							return DOMPurify.sanitize(r);
						}
					} else {
						return DOMPurify.sanitize(a);
					}
				}
			);
		};
		var translation = text;
		var bundle = this._bundles[app] || {};
		var value = bundle[text];
		if( typeof(value) !== 'undefined' ){
			translation = value;
		}

		if(typeof vars === 'object' || count !== undefined ) {
			return DOMPurify.sanitize(_build(translation, vars, count));
		} else {
			return DOMPurify.sanitize(translation);
		}
	},

	/**
	 * Translate a plural string
	 * @param {string} app the id of the app for which to translate the string
	 * @param {string} textSingular the string to translate for exactly one object
	 * @param {string} textPlural the string to translate for n objects
	 * @param {number} count number to determine whether to use singular or plural
	 * @param [vars] map of placeholder key to value
	 * @param {array} [options] options array
	 * @param {bool} [options.escape=true] enable/disable auto escape of placeholders (by default enabled)
	 * @return {string} Translated string
	 */
	translatePlural: function(app, textSingular, textPlural, count, vars, options) {
		var identifier = '_' + textSingular + '_::_' + textPlural + '_';
		var bundle = this._bundles[app] || {};
		var value = bundle[identifier];
		if( typeof(value) !== 'undefined' ){
			var translation = value;
			if ($.isArray(translation)) {
				var plural = this._pluralFunctions[app](count);
				return this.translate(app, translation[plural.plural], vars, count, options);
			}
		}

		if(count === 1) {
			return this.translate(app, textSingular, vars, count, options);
		}
		else{
			return this.translate(app, textPlural, vars, count, options);
		}
	}
};

/**
 * translate a string
 * @param {string} app the id of the app for which to translate the string
 * @param {string} text the string to translate
 * @param [vars] map of placeholder key to value
 * @param {number} [count] number to replace %n with
 * @return {string}
 */
window.t = _.bind(OC.L10N.translate, OC.L10N);

/**
 * translate a string
 * @param {string} app the id of the app for which to translate the string
 * @param {string} text_singular the string to translate for exactly one object
 * @param {string} text_plural the string to translate for n objects
 * @param {number} count number to determine whether to use singular or plural
 * @param [vars] map of placeholder key to value
 * @return {string} Translated string
 */
window.n = _.bind(OC.L10N.translatePlural, OC.L10N);

Handlebars.registerHelper('t', function(app, text) {
	return OC.L10N.translate(app, text);
});



/**
 * jQuery plugin for micro templates
 *
 * Strings are automatically escaped, but that can be disabled by setting
 * escapeFunction to null.
 *
 * Usage examples:
 *
 *	var htmlStr = '<p>Bake, uncovered, until the {greasystuff} is melted and the {pasta} is heated through, about {min} minutes.</p>'
 *	$(htmlStr).octemplate({greasystuff: 'cheese', pasta: 'macaroni', min: 10});
 *
 * 	var htmlStr = '<p>Welcome back {user}</p>';
 *	$(htmlStr).octemplate({user: 'John Q. Public'}, {escapeFunction: null});
 *
 * Be aware that the target string must be wrapped in an HTML element for the
 * plugin to work. The following won't work:
 * 
 *      var textStr = 'Welcome back {user}';
 *      $(textStr).octemplate({user: 'John Q. Public'});
 *
 * For anything larger than one-liners, you can use a simple $.get() ajax
 * request to get the template, or you can embed them it the page using the
 * text/template type:
 *
 * <script id="contactListItemTemplate" type="text/template">
 *	<tr class="contact" data-id="{id}">
 *		<td class="name">
 *			<input type="checkbox" name="id" value="{id}" /><span class="nametext">{name}</span>
 *		</td>
 *		<td class="email">
 *			<a href="mailto:{email}">{email}</a>
 *		</td>
 *		<td class="phone">{phone}</td>
 *	</tr>
 * </script>
 *
 * var $tmpl = $('#contactListItemTemplate');
 * var contacts = // fetched in some ajax call
 *
 * $.each(contacts, function(idx, contact) {
 * 		$contactList.append(
 * 			$tmpl.octemplate({
 * 				id: contact.getId(),
 * 				name: contact.getDisplayName(),
 * 				email: contact.getPreferredEmail(),
 * 				phone: contact.getPreferredPhone(),
 * 			});
 * 		);
 * });
 */
(function( $ ) {
	/**
	* Object Template
	* Inspired by micro templating done by e.g. underscore.js
	*/
	var Template = {
		init: function(vars, options, elem) {
			// Mix in the passed in options with the default options
			this.vars = vars;
			this.options = $.extend({},this.options,options);

			this.elem = elem;
			var self = this;

			if(typeof this.options.escapeFunction === 'function') {
				var keys = Object.keys(this.vars);
				for (var key = 0; key < keys.length; key++) {
					if(typeof this.vars[keys[key]] === 'string') {
						this.vars[keys[key]] = self.options.escapeFunction(this.vars[keys[key]]);
					}
				}
			}

			var _html = this._build(this.vars);
			return $(_html);
		},
		// From stackoverflow.com/questions/1408289/best-way-to-do-variable-interpolation-in-javascript
		_build: function(o){
			var data = this.elem.attr('type') === 'text/template' ? this.elem.html() : this.elem.get(0).outerHTML;
			try {
				return data.replace(/{([^{}]*)}/g,
					function (a, b) {
						var r = o[b];
						return typeof r === 'string' || typeof r === 'number' ? r : a;
					}
				);
			} catch(e) {
				console.error(e, 'data:', data);
			}
		},
		options: {
			escapeFunction: escapeHTML
		}
	};

	$.fn.octemplate = function(vars, options) {
		vars = vars || {};
		if(this.length) {
			var _template = Object.create(Template);
			return _template.init(vars, options, this);
		}
	};

})( jQuery );



/**
 * ownCloud
 *
 * @author Robin Appelman
 * @copyright 2012 Robin Appelman icewind1991@gmail.com
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * Wrapper for server side events
 * (http://en.wikipedia.org/wiki/Server-sent_events)
 * includes a fallback for older browsers and IE
 *
 * use server side events with caution, too many open requests can hang the
 * server
 */

/* global EventSource */

/**
 * Create a new event source
 * @param {string} src
 * @param {object} [data] to be send as GET
 *
 * @constructs OC.EventSource
 */
OC.EventSource=function(src,data){
	var dataStr='';
	var name;
	var joinChar;
	this.typelessListeners=[];
	this.closed = false;
	this.listeners={};
	if(data){
		for(name in data){
			dataStr+=name+'='+encodeURIComponent(data[name])+'&';
		}
	}
	dataStr+='requesttoken='+encodeURIComponent(oc_requesttoken);
	if(!this.useFallBack && typeof EventSource !== 'undefined'){
		joinChar = '&';
		if(src.indexOf('?') === -1) {
			joinChar = '?';
		}
		this.source= new EventSource(src+joinChar+dataStr);
		this.source.onmessage=function(e){
			for(var i=0;i<this.typelessListeners.length;i++){
				this.typelessListeners[i](JSON.parse(e.data));
			}
		}.bind(this);
	}else{
		var iframeId='oc_eventsource_iframe_'+OC.EventSource.iframeCount;
		OC.EventSource.fallBackSources[OC.EventSource.iframeCount]=this;
		this.iframe=$('<iframe/>');
		this.iframe.attr('id',iframeId);
		this.iframe.hide();

		joinChar = '&';
		if(src.indexOf('?') === -1) {
			joinChar = '?';
		}
		this.iframe.attr('src',src+joinChar+'fallback=true&fallback_id='+OC.EventSource.iframeCount+'&'+dataStr);
		$('body').append(this.iframe);
		this.useFallBack=true;
		OC.EventSource.iframeCount++;
	}
	//add close listener
	this.listen('__internal__',function(data){
		if(data === 'close'){
			this.close();
		}
	}.bind(this));
};
OC.EventSource.fallBackSources=[];
OC.EventSource.iframeCount=0;//number of fallback iframes
OC.EventSource.fallBackCallBack=function(id,type,data){
	OC.EventSource.fallBackSources[id].fallBackCallBack(type,data);
};
OC.EventSource.prototype={
	typelessListeners:[],
	iframe:null,
	listeners:{},//only for fallback
	useFallBack:false,
	/**
	 * Fallback callback for browsers that don't have the
	 * native EventSource object.
	 *
	 * Calls the registered listeners.
	 *
	 * @private
	 * @param {String} type event type
	 * @param {Object} data received data
	 */
	fallBackCallBack:function(type,data){
		var i;
		// ignore messages that might appear after closing
		if (this.closed) {
			return;
		}
		if(type){
			if (typeof this.listeners.done !== 'undefined') {
				for(i=0;i<this.listeners[type].length;i++){
					this.listeners[type][i](data);
				}
			}
		}else{
			for(i=0;i<this.typelessListeners.length;i++){
				this.typelessListeners[i](data);
			}
		}
	},
	lastLength:0,//for fallback
	/**
	 * Listen to a given type of events.
	 *
	 * @param {String} type event type
	 * @param {Function} callback event callback
	 */
	listen:function(type,callback){
		if(callback && callback.call){

			if(type){
				if(this.useFallBack){
					if(!this.listeners[type]){
						this.listeners[type]=[];
					}
					this.listeners[type].push(callback);
				}else{
					this.source.addEventListener(type,function(e){
						if (typeof e.data !== 'undefined') {
							callback(JSON.parse(e.data));
						} else {
							callback('');
						}
					},false);
				}
			}else{
				this.typelessListeners.push(callback);
			}
		}
	},
	/**
	 * Closes this event source.
	 */
	close:function(){
		this.closed = true;
		if (typeof this.source !== 'undefined') {
			this.source.close();
		}
	}
};


/**
 * @copyright Copyright (c) 2016 Joas Schilling <coding@schilljs.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @namespace
 * @since 11.0.0
 */
OCP.AppConfig = {
	/**
	 * @param {string} method
	 * @param {string} endpoint
	 * @param {Object} [options]
	 * @param {Object} [options.data]
	 * @param {function} [options.success]
	 * @param {function} [options.error]
	 * @internal
	 */
	_call: function(method, endpoint, options) {
		if ((method === 'post' || method === 'delete') && OC.PasswordConfirmation.requiresPasswordConfirmation()) {
			OC.PasswordConfirmation.requirePasswordConfirmation(_.bind(this._call, this, method, endpoint, options));
			return;
		}

		options = options || {};
		$.ajax({
			type: method.toUpperCase(),
			url: OC.linkToOCS('apps/provisioning_api/api/v1', 2) + 'config/apps' + endpoint,
			data: options.data || {},
			success: options.success,
			error: options.error
		});
	},

	/**
	 * @param {Object} [options]
	 * @param {function} [options.success]
	 * @since 11.0.0
	 */
	getApps: function(options) {
		this._call('get', '', options);
	},

	/**
	 * @param {string} app
	 * @param {Object} [options]
	 * @param {function} [options.success]
	 * @param {function} [options.error]
	 * @since 11.0.0
	 */
	getKeys: function(app, options) {
		this._call('get', '/' + app, options);
	},

	/**
	 * @param {string} app
	 * @param {string} key
	 * @param {string|function} defaultValue
	 * @param {Object} [options]
	 * @param {function} [options.success]
	 * @param {function} [options.error]
	 * @since 11.0.0
	 */
	getValue: function(app, key, defaultValue, options) {
		options = options || {};
		options.data = {
			defaultValue: defaultValue
		};

		this._call('get', '/' + app + '/' + key, options);
	},

	/**
	 * @param {string} app
	 * @param {string} key
	 * @param {string} value
	 * @param {Object} [options]
	 * @param {function} [options.success]
	 * @param {function} [options.error]
	 * @since 11.0.0
	 */
	setValue: function(app, key, value, options) {
		options = options || {};
		options.data = {
			value: value
		};

		this._call('post', '/' + app + '/' + key, options);
	},

	/**
	 * @param {string} app
	 * @param {string} key
	 * @param {Object} [options]
	 * @param {function} [options.success]
	 * @param {function} [options.error]
	 * @since 11.0.0
	 */
	deleteKey: function(app, key, options) {
		this._call('delete', '/' + app + '/' + key, options);
	}
};


/**
 * @copyright (c) 2017 Arthur Schiwon <blizzz@arthur-schiwon.de>
 *
 * @author Arthur Schiwon <blizzz@arthur-schiwon.de>
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 */

(function(OCP) {
	"use strict";

	OCP.Comments = {

		/*
		 * Detects links:
		 * Either the http(s) protocol is given or two strings, basically limited to ascii with the last
		 * 	word being at least one digit long,
		 * followed by at least another character
		 *
		 * The downside: anything not ascii is excluded. Not sure how common it is in areas using different
		 * alphabets… the upside: fake domains with similar looking characters won't be formatted as links
		 */
		urlRegex: /(\b(https?:\/\/|([-A-Z0-9+_])*\.([-A-Z])+)[-A-Z0-9+&@#\/%?=~_|!:,.;()]*[-A-Z0-9+&@#\/%=~_|()])/ig,
		protocolRegex: /^https:\/\//,

		plainToRich: function(content) {
			content = this.formatLinksRich(content);
			return content;
		},

		richToPlain: function(content) {
			content = this.formatLinksPlain(content);
			return content;
		},

		formatLinksRich: function(content) {
			var self = this;
			return content.replace(this.urlRegex, function(url) {
				var hasProtocol = (url.indexOf('https://') !== -1) || (url.indexOf('http://') !== -1);
				if(!hasProtocol) {
					url = 'https://' + url;
				}

				var linkText = url.replace(self.protocolRegex, '');
				return '<a class="external" target="_blank" rel="noopener noreferrer" href="' + url + '">' + linkText + '</a>';
			});
		},

		formatLinksPlain: function(content) {
			var $content = $('<div></div>').html(content);
			$content.find('a').each(function () {
				var $this = $(this);
				$this.html($this.attr('href'));
			});
			return $content.html();
		}

	};
})(OCP);


/**
 * @copyright Copyright (c) 2016 Joas Schilling <coding@schilljs.com>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/**
 * @namespace
 * @deprecated Use OCP.AppConfig instead
 */
OC.AppConfig={
	/**
	 * @deprecated Use OCP.AppConfig.getValue() instead
	 */
	getValue:function(app,key,defaultValue,callback){
		OCP.AppConfig.getValue(app, key, defaultValue, {
			success: callback
		});
	},

	/**
	 * @deprecated Use OCP.AppConfig.setValue() instead
	 */
	setValue:function(app,key,value){
		OCP.AppConfig.setValue(app, key, value);
	},

	/**
	 * @deprecated Use OCP.AppConfig.getApps() instead
	 */
	getApps:function(callback){
		OCP.AppConfig.getApps({
			success: callback
		});
	},

	/**
	 * @deprecated Use OCP.AppConfig.getKeys() instead
	 */
	getKeys:function(app,callback){
		OCP.AppConfig.getKeys(app, {
			success: callback
		});
	},

	/**
	 * @deprecated
	 */
	hasKey:function(app,key,callback){
		console.error('OC.AppConfig.hasKey is not supported anymore. Use OCP.AppConfig.getValue instead.');
	},

	/**
	 * @deprecated Use OCP.AppConfig.deleteKey() instead
	 */
	deleteKey:function(app,key){
		OCP.AppConfig.deleteKey(app, key);
	},

	/**
	 * @deprecated
	 */
	deleteApp:function(app){
		console.error('OC.AppConfig.deleteApp is not supported anymore.');
	}
};


$(document).on('ajaxSend',function(elm, xhr, settings) {
	if(settings.crossDomain === false) {
		xhr.setRequestHeader('requesttoken', oc_requesttoken);
		xhr.setRequestHeader('OCS-APIREQUEST', 'true');
	}
});


/**
 * ownCloud - core
 *
 * This file is licensed under the Affero General Public License version 3 or
 * later. See the COPYING file.
 *
 * @author Bernhard Posselt <dev@bernhard-posselt.com>
 * @copyright Bernhard Posselt 2014
 */

(function (document, $, exports) {

	'use strict';

	var dynamicSlideToggleEnabled = false;

	exports.Apps = {
		enableDynamicSlideToggle: function () {
			dynamicSlideToggleEnabled = true;
		}
	};

	/**
	 * Shows the #app-sidebar and add .with-app-sidebar to subsequent siblings
	 *
	 * @param {Object} [$el] sidebar element to show, defaults to $('#app-sidebar')
	 */
	exports.Apps.showAppSidebar = function($el) {
		var $appSidebar = $el || $('#app-sidebar');
		$appSidebar.removeClass('disappear')
			.show('slide', { direction: 'right' }, 200);
		$('#app-content').addClass('with-app-sidebar', 200).trigger(new $.Event('appresized'));
	};

	/**
	 * Shows the #app-sidebar and removes .with-app-sidebar from subsequent
	 * siblings
	 *
	 * @param {Object} [$el] sidebar element to hide, defaults to $('#app-sidebar')
	 */
	exports.Apps.hideAppSidebar = function($el) {
		var $appSidebar = $el || $('#app-sidebar');
		$appSidebar.hide('slide', { direction: 'right' }, 100,
			function() {
				$appSidebar.addClass('disappear');
			});
		$('#app-content').removeClass('with-app-sidebar', 100).trigger(new $.Event('appresized'));
	};

	/**
	 * Provides a way to slide down a target area through a button and slide it
	 * up if the user clicks somewhere else. Used for the news app settings and
	 * add new field.
	 *
	 * Usage:
	 * <button data-apps-slide-toggle=".slide-area">slide</button>
	 * <div class=".slide-area" class="hidden">I'm sliding up</div>
	 */
	var registerAppsSlideToggle = function () {
		var buttons = $('[data-apps-slide-toggle]');

		if (buttons.length === 0) {
			$('#app-navigation').addClass('without-app-settings');
		}

		$(document).click(function (event) {

			if (dynamicSlideToggleEnabled) {
				buttons = $('[data-apps-slide-toggle]');
			}

			buttons.each(function (index, button) {

				var areaSelector = $(button).data('apps-slide-toggle');
				var area = $(areaSelector);

				function hideArea() {
					area.slideUp(OC.menuSpeed*4, function() {
						area.trigger(new $.Event('hide'));
					});
					area.removeClass('opened');
					$(button).removeClass('opened');
				}
				function showArea() {
					area.slideDown(OC.menuSpeed*4, function() {
						area.trigger(new $.Event('show'));
					});
					area.addClass('opened');
					$(button).addClass('opened');
					var input = $(areaSelector + ' [autofocus]');
					if (input.length === 1) {
						input.focus();
					}
				}

				// do nothing if the area is animated
				if (!area.is(':animated')) {

					// button toggles the area
					if ($(button).is($(event.target).closest('[data-apps-slide-toggle]'))) {
						if (area.is(':visible')) {
							hideArea();
						} else {
							showArea();
						}

					// all other areas that have not been clicked but are open
					// should be slid up
					} else {
						var closest = $(event.target).closest(areaSelector);
						if (area.is(':visible') && closest[0] !== area[0]) {
							hideArea();
						}
					}
				}
			});

		});
	};


	$(document).ready(function () {
		registerAppsSlideToggle();
	});

}(document, jQuery, OC));


/**
 * @author Roeland Jago Douma <roeland@famdouma.nl>
 *
 * @copyright Copyright (c) 2015, ownCloud, Inc.
 * @license AGPL-3.0
 *
 * This code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3,
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License, version 3,
 * along with this program.  If not, see <http://www.gnu.org/licenses/>
 *
 */

/**
 * Namespace to hold functions related to convert mimetype to icons
 *
 * @namespace
 */
OC.MimeType = {

	/**
	 * Cache that maps mimeTypes to icon urls
	 */
	_mimeTypeIcons: {},

	/**
	 * Return the file icon we want to use for the given mimeType.
	 * The file needs to be present in the supplied file list
	 *
	 * @param {string} mimeType The mimeType we want an icon for
	 * @param {array} files The available icons in this theme
	 * @return {string} The icon to use or null if there is no match
	 */
	_getFile: function(mimeType, files) {
		var icon = mimeType.replace(new RegExp('/', 'g'), '-');

		// Generate path
		if (mimeType === 'dir' && $.inArray('folder', files) !== -1) {
			return 'folder';
		} else if (mimeType === 'dir-encrypted' && $.inArray('folder-encrypted', files) !== -1) {
			return 'folder-encrypted';
		} else if (mimeType === 'dir-shared' && $.inArray('folder-shared', files) !== -1) {
			return 'folder-shared';
		} else if (mimeType === 'dir-public' && $.inArray('folder-public', files) !== -1) {
			return 'folder-public';
		} else if (mimeType === 'dir-external' && $.inArray('folder-external', files) !== -1) {
			return 'folder-external';
		} else if ($.inArray(icon, files) !== -1) {
			return icon;
		} else if ($.inArray(icon.split('-')[0], files) !== -1) {
			return icon.split('-')[0];
		} else if ($.inArray('file', files) !== -1) {
			return 'file';
		}

		return null;
	},

	/**
	 * Return the url to icon of the given mimeType
	 *
	 * @param {string} mimeType The mimeType to get the icon for
	 * @return {string} Url to the icon for mimeType
	 */
	getIconUrl: function(mimeType) {
		if (_.isUndefined(mimeType)) {
			return undefined;
		}

		while (mimeType in OC.MimeTypeList.aliases) {
			mimeType = OC.MimeTypeList.aliases[mimeType];
		}
		if (mimeType in OC.MimeType._mimeTypeIcons) {
			return OC.MimeType._mimeTypeIcons[mimeType];
		}

		// First try to get the correct icon from the current theme
		var gotIcon = null;
		var path = '';
		if (OC.theme.folder !== '' && $.isArray(OC.MimeTypeList.themes[OC.theme.folder])) {
			path = OC.webroot + '/themes/' + OC.theme.folder + '/core/img/filetypes/';
			var icon = OC.MimeType._getFile(mimeType, OC.MimeTypeList.themes[OC.theme.folder]);

			if (icon !== null) {
				gotIcon = true;
				path += icon;
			}
		}
		if(OCA.Theming && gotIcon === null) {
			path = OC.generateUrl('/apps/theming/img/core/filetypes/');
			path += OC.MimeType._getFile(mimeType, OC.MimeTypeList.files);
			gotIcon = true;
		}

		// If we do not yet have an icon fall back to the default
		if (gotIcon === null) {
			path = OC.webroot + '/core/img/filetypes/';
			path += OC.MimeType._getFile(mimeType, OC.MimeTypeList.files);
		}

		path += '.svg';

		if(OCA.Theming) {
			path += "?v=" + OCA.Theming.cacheBuster;
		}

		// Cache the result
		OC.MimeType._mimeTypeIcons[mimeType] = path;
		return path;
	}

};


/**
* This file is automatically generated
* DO NOT EDIT MANUALLY!
*
* You can update the list of MimeType Aliases in config/mimetypealiases.json
* The list of files is fetched from core/img/filetypes
* To regenerate this file run ./occ maintenance:mimetype:update-js
*/
OC.MimeTypeList={
	aliases: {
    "application/coreldraw": "image",
    "application/epub+zip": "text",
    "application/font-sfnt": "image",
    "application/font-woff": "image",
    "application/gpx+xml": "location",
    "application/illustrator": "image",
    "application/javascript": "text/code",
    "application/json": "text/code",
    "application/msaccess": "file",
    "application/msexcel": "x-office/spreadsheet",
    "application/msonenote": "x-office/document",
    "application/mspowerpoint": "x-office/presentation",
    "application/msword": "x-office/document",
    "application/octet-stream": "file",
    "application/postscript": "image",
    "application/rss+xml": "application/xml",
    "application/vnd.android.package-archive": "package/x-generic",
    "application/vnd.lotus-wordpro": "x-office/document",
    "application/vnd.garmin.tcx+xml": "location",
    "application/vnd.google-earth.kml+xml": "location",
    "application/vnd.google-earth.kmz": "location",
    "application/vnd.ms-excel": "x-office/spreadsheet",
    "application/vnd.ms-excel.addin.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.sheet.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-excel.template.macroEnabled.12": "x-office/spreadsheet",
    "application/vnd.ms-fontobject": "image",
    "application/vnd.ms-powerpoint": "x-office/presentation",
    "application/vnd.ms-powerpoint.addin.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.presentation.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.slideshow.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-powerpoint.template.macroEnabled.12": "x-office/presentation",
    "application/vnd.ms-word.document.macroEnabled.12": "x-office/document",
    "application/vnd.ms-word.template.macroEnabled.12": "x-office/document",
    "application/vnd.oasis.opendocument.presentation": "x-office/presentation",
    "application/vnd.oasis.opendocument.presentation-template": "x-office/presentation",
    "application/vnd.oasis.opendocument.spreadsheet": "x-office/spreadsheet",
    "application/vnd.oasis.opendocument.spreadsheet-template": "x-office/spreadsheet",
    "application/vnd.oasis.opendocument.text": "x-office/document",
    "application/vnd.oasis.opendocument.text-master": "x-office/document",
    "application/vnd.oasis.opendocument.text-template": "x-office/document",
    "application/vnd.oasis.opendocument.text-web": "x-office/document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.presentationml.template": "x-office/presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "x-office/spreadsheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": "x-office/spreadsheet",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "x-office/document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": "x-office/document",
    "application/vnd.visio": "x-office/document",
    "application/vnd.wordperfect": "x-office/document",
    "application/x-7z-compressed": "package/x-generic",
    "application/x-bzip2": "package/x-generic",
    "application/x-cbr": "text",
    "application/x-compressed": "package/x-generic",
    "application/x-dcraw": "image",
    "application/x-deb": "package/x-generic",
    "application/x-fictionbook+xml": "text",
    "application/x-font": "image",
    "application/x-gimp": "image",
    "application/x-gzip": "package/x-generic",
    "application/x-iwork-keynote-sffkey": "x-office/presentation",
    "application/x-iwork-numbers-sffnumbers": "x-office/spreadsheet",
    "application/x-iwork-pages-sffpages": "x-office/document",
    "application/x-mobipocket-ebook": "text",
    "application/x-perl": "text/code",
    "application/x-photoshop": "image",
    "application/x-php": "text/code",
    "application/x-rar-compressed": "package/x-generic",
    "application/x-tar": "package/x-generic",
    "application/x-tex": "text",
    "application/xml": "text/html",
    "application/yaml": "text/code",
    "application/zip": "package/x-generic",
    "database": "file",
    "httpd/unix-directory": "dir",
    "text/css": "text/code",
    "text/csv": "x-office/spreadsheet",
    "text/html": "text/code",
    "text/x-c": "text/code",
    "text/x-c++src": "text/code",
    "text/x-h": "text/code",
    "text/x-java-source": "text/code",
    "text/x-ldif": "text/code",
    "text/x-python": "text/code",
    "text/x-shellscript": "text/code",
    "web": "text/code",
    "application/internet-shortcut": "link"
},
	files: [
    "application",
    "application-pdf",
    "audio",
    "file",
    "folder",
    "folder-drag-accept",
    "folder-encrypted",
    "folder-external",
    "folder-public",
    "folder-shared",
    "folder-starred",
    "image",
    "link",
    "location",
    "package-x-generic",
    "text",
    "text-calendar",
    "text-code",
    "text-vcard",
    "video",
    "x-office-document",
    "x-office-presentation",
    "x-office-spreadsheet"
],
	themes: []
};


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Backbone */
if(!_.isUndefined(Backbone)) {
	OC.Backbone = Backbone.noConflict();
}


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Select2 */

/**
 * Select2 extension for toggling values in a multi-select dropdown
 */
(function(Select2) {

	var Select2FindHighlightableChoices = Select2.class.multi.prototype.findHighlightableChoices;
	Select2.class.multi.prototype.findHighlightableChoices = function () {
		if (this.opts.toggleSelect) {
			return this.results.find('.select2-result-selectable:not(.select2-disabled)');
		}
		return Select2FindHighlightableChoices.apply(this, arguments);
	};

	var Select2TriggerSelect = Select2.class.multi.prototype.triggerSelect;
	Select2.class.multi.prototype.triggerSelect = function (data) {
		if (this.opts.toggleSelect && this.val().indexOf(this.id(data)) !== -1) {
			var self = this;
			var val = this.id(data);

			var selectionEls = this.container.find('.select2-search-choice').filter(function() {
				return (self.id($(this).data('select2-data')) === val);
			});

			if (this.unselect(selectionEls)) {
				// also unselect in dropdown
				this.results.find('.select2-result.select2-selected').each(function () {
					var $this = $(this);
					if (self.id($this.data('select2-data')) === val) {
						$this.removeClass('select2-selected');
					}
				});
				this.clearSearch();
			}

			return false;
		} else {
			return Select2TriggerSelect.apply(this, arguments);
		}
	};

})(Select2);



/**
 * ownCloud
 *
 * @author John Molakvoæ
 * @copyright 2016-2017 John Molakvoæ <skjnldsv@protonmail.com>
 * @author Morris Jobke
 * @copyright 2013 Morris Jobke <morris.jobke@gmail.com>
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU AFFERO GENERAL PUBLIC LICENSE
 * License as published by the Free Software Foundation; either
 * version 3 of the License, or any later version.
 *
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU AFFERO GENERAL PUBLIC LICENSE for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License along with this library.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

/*
 * Adds a background color to the element called on and adds the first character
 * of the passed in string. This string is also the seed for the generation of
 * the background color.
 *
 * You have following HTML:
 *
 * <div id="albumart"></div>
 *
 * And call this from Javascript:
 *
 * $('#albumart').imageplaceholder('The Album Title');
 *
 * Which will result in:
 *
 * <div id="albumart" style="background-color: hsl(123, 90%, 65%); ... ">T</div>
 *
 * You may also call it like this, to have a different background, than the seed:
 *
 * $('#albumart').imageplaceholder('The Album Title', 'Album Title');
 *
 * Resulting in:
 *
 * <div id="albumart" style="background-color: hsl(123, 90%, 65%); ... ">A</div>
 *
 */

 /*
 * Alternatively, you can use the prototype function to convert your string to hsl colors:
 *
 * "a6741a86aded5611a8e46ce16f2ad646".toHsl()
 *
 * Will return the hsl parameters within an array:
 *
 * [290, 60, 68]
 *
 */

(function ($) {

	String.prototype.toHsl = function() {

		var hash = this.toLowerCase().replace(/[^0-9a-f]+/g, '');

		// Already a md5 hash?
		if( !hash.match(/^[0-9a-f]{32}$/g) ) {
			hash = md5(hash);
		}

		function rgbToHsl(r, g, b) {
			r /= 255; g /= 255; b /= 255;
			var max = Math.max(r, g, b), min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;
			if(max === min) {
				h = s = 0; // achromatic
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch(max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
				}
				h /= 6;
			}
			return [h, s, l];
		}

		// Init vars
		var result = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
		var rgb = [0, 0, 0];
		var sat = 70;
		var lum = 68;
		var modulo = 16;

		// Splitting evenly the string
		for(var i in hash) {
			result[i%modulo] = result[i%modulo] + parseInt(hash.charAt(i), 16).toString();
		}

		// Converting our data into a usable rgb format
		// Start at 1 because 16%3=1 but 15%3=0 and makes the repartition even
		for(var count=1;count<modulo;count++) {
			rgb[count%3] += parseInt(result[count]);
		}

		// Reduce values bigger than rgb requirements
		rgb[0] = rgb[0]%255;
		rgb[1] = rgb[1]%255;
		rgb[2] = rgb[2]%255;

		var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);

		// Classic formulla to check the brigtness for our eye
		// If too bright, lower the sat
		var bright = Math.sqrt( 0.299 * Math.pow(rgb[0], 2) + 0.587 * Math.pow(rgb[1], 2) + 0.114 * Math.pow(rgb[2], 2) );
		if (bright >= 200) {
			sat = 60;
		}
		return [parseInt(hsl[0] * 360), sat, lum];
	};

	$.fn.imageplaceholder = function(seed, text, size) {
		text = text || seed;

		// Compute the hash
		var hsl = seed.toHsl();
		this.css('background-color', 'hsl('+hsl[0]+', '+hsl[1]+'%, '+hsl[2]+'%)');

		// Placeholders are square
		var height = this.height() || size || 32;
		this.height(height);
		this.width(height);

		// CSS rules
		this.css('color', '#fff');
		this.css('font-weight', 'normal');
		this.css('text-align', 'center');

		// calculate the height
		this.css('line-height', height + 'px');
		this.css('font-size', (height * 0.55) + 'px');

		if(seed !== null && seed.length) {
			this.html(text[0].toUpperCase());
		}
	};

	$.fn.clearimageplaceholder = function() {
		this.css('background-color', '');
		this.css('color', '');
		this.css('font-weight', '');
		this.css('text-align', '');
		this.css('line-height', '');
		this.css('font-size', '');
		this.html('');
		this.removeClass('icon-loading');
	};
}(jQuery));


/**
 * Copyright (c) 2013 Christopher Schäpers <christopher@schaepers.it>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

/**
 * This plugin inserts the right avatar for the user, depending on, whether a
 * custom avatar is uploaded - which it uses then - or not, and display a
 * placeholder with the first letter of the users name instead.
 * For this it queries the core_avatar_get route, thus this plugin is fit very
 * tightly for owncloud, and it may not work anywhere else.
 *
 * You may use this on any <div></div>
 * Here I'm using <div class="avatardiv"></div> as an example.
 *
 * There are 5 ways to call this:
 *
 * 1. $('.avatardiv').avatar('jdoe', 128);
 * This will make the div to jdoe's fitting avatar, with a size of 128px.
 *
 * 2. $('.avatardiv').avatar('jdoe');
 * This will make the div to jdoe's fitting avatar. If the div already has a
 * height, it will be used for the avatars size. Otherwise this plugin will
 * search for 'size' DOM data, to use for avatar size. If neither are available
 * it will default to 64px.
 *
 * 3. $('.avatardiv').avatar();
 * This will search the DOM for 'user' data, to use as the username. If there
 * is no username available it will default to a placeholder with the value of
 * "?". The size will be determined the same way, as the second example.
 *
 * 4. $('.avatardiv').avatar('jdoe', 128, true);
 * This will behave like the first example, except it will also append random
 * hashes to the custom avatar images, to force image reloading in IE8.
 *
 * 5. $('.avatardiv').avatar('jdoe', 128, undefined, true);
 * This will behave like the first example, but it will hide the avatardiv, if
 * it will display the default placeholder. undefined is the ie8fix from
 * example 4 and can be either true, or false/undefined, to be ignored.
 *
 * 6. $('.avatardiv').avatar('jdoe', 128, undefined, true, callback);
 * This will behave like the above example, but it will call the function
 * defined in callback after the avatar is placed into the DOM.
 *
 */

(function ($) {
	$.fn.avatar = function(user, size, ie8fix, hidedefault, callback, displayname) {
		var setAvatarForUnknownUser = function(target) {
			target.imageplaceholder('?');
			target.css('background-color', '#b9b9b9');
		};

		if (typeof(user) !== 'undefined') {
			user = String(user);
		}
		if (typeof(displayname) !== 'undefined') {
			displayname = String(displayname);
		}

		if (typeof(size) === 'undefined') {
			if (this.height() > 0) {
				size = this.height();
			} else if (this.data('size') > 0) {
				size = this.data('size');
			} else {
				size = 64;
			}
		}

		this.height(size);
		this.width(size);

		if (typeof(user) === 'undefined') {
			if (typeof(this.data('user')) !== 'undefined') {
				user = this.data('user');
			} else {
				setAvatarForUnknownUser(this);
				return;
			}
		}

		// sanitize
		user = String(user).replace(/\//g,'');

		var $div = this;
		var url;

		// If this is our own avatar we have to use the version attribute
		if (user === OC.getCurrentUser().uid) {
			url = OC.generateUrl(
				'/avatar/{user}/{size}?v={version}',
				{
					user: user,
					size: Math.ceil(size * window.devicePixelRatio),
					version: oc_userconfig.avatar.version
				});
		} else {
			url = OC.generateUrl(
				'/avatar/{user}/{size}',
				{
					user: user,
					size: Math.ceil(size * window.devicePixelRatio)
				});
		}

		var img = new Image();

		// If the new image loads successfully set it.
		img.onload = function() {
			$div.clearimageplaceholder();
			$div.append(img);

			if(typeof callback === 'function') {
				callback();
			}
		};
		// Fallback when avatar loading fails:
		// Use old placeholder when a displayname attribute is defined,
		// otherwise show the unknown user placeholder.
		img.onerror = function () {
			$div.clearimageplaceholder();
			if (typeof(displayname) !== 'undefined') {
				$div.imageplaceholder(user, displayname);
			} else {
				setAvatarForUnknownUser($div);
			}

			if(typeof callback === 'function') {
				callback();
			}
		};

		$div.addClass('icon-loading');
		img.width = size;
		img.height = size;
		img.src = url;
	};
}(jQuery));


/**
 * Copyright (c) 2017 Georg Ehrke <oc.list@georgehrke.com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 * See the COPYING-README file.
 */

(function ($) {
	var ENTRY = ''
		+ '<li>'
		+ '    <a href="{{hyperlink}}">'
		+ '        {{#if icon}}<img src="{{icon}}">{{/if}}'
		+ '        <span>{{title}}</span>'
		+ '    </a>'
		+ '</li>';

	var LIST = ''
		+ '<div class="menu popovermenu bubble hidden contactsmenu-popover">'
		+ '    <ul>'
		+ '        <li>'
		+ '            <a>'
		+ '                <span class="icon-loading-small"></span>'
		+ '            </a>'
		+ '        </li>'
		+ '    </ul>'
		+ '</div>';

	$.fn.contactsMenu = function(shareWith, shareType, appendTo) {
		// 0 - user, 4 - email, 6 - remote
		var allowedTypes = [0, 4, 6];
		if (allowedTypes.indexOf(shareType) === -1) {
			return;
		}

		var $div = this;
		appendTo.append(LIST);
		var $list = appendTo.find('div.contactsmenu-popover');

		$div.click(function() {
			if (!$list.hasClass('hidden')) {
				$list.addClass('hidden');
				$list.hide();
				return;
			}

			$list.removeClass('hidden');
			$list.show();

			if ($list.hasClass('loaded')) {
				return;
			}

			$list.addClass('loaded');
			$.ajax(OC.generateUrl('/contactsmenu/findOne'), {
				method: 'POST',
				data: {
					shareType: shareType,
					shareWith: shareWith
				}
			}).then(function(data) {
				$list.find('ul').find('li').addClass('hidden');

				var actions;
				if (!data.topAction) {
					actions = [{
						hyperlink: '#',
						title: t('core', 'No action available')
					}];
				} else {
					actions = [data.topAction].concat(data.actions);
				}

				actions.forEach(function(action) {
					var template = Handlebars.compile(ENTRY);
					$list.find('ul').append(template(action));
				});

				if (actions.length === 0) {

				}
			}, function(jqXHR) {
				$list.find('ul').find('li').addClass('hidden');

				var title;
				if (jqXHR.status === 404) {
					title = t('core', 'No action available');
				} else {
					title = t('core', 'Error fetching contact actions');
				}

				var template = Handlebars.compile(ENTRY);
				$list.find('ul').append(template({
					hyperlink: '#',
					title: title
				}));
			});
		});

		$(document).click(function(event) {
			var clickedList = ($list.has(event.target).length > 0);
			var clickedTarget = ($div.has(event.target).length > 0);

			$div.each(function() {
				if ($(this).is(event.target)) {
					clickedTarget = true;
				}
			});

			if (clickedList || clickedTarget) {
				return;
			}

			$list.addClass('hidden');
			$list.hide();
		});
	};
}(jQuery));


