/*
 * Copyright (c) 2014
 *
 * @author Vincent Petry
 * @copyright 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global dragOptions, folderDropOptions, OC */
(function() {

	if (!OCA.Files) {
		/**
		 * Namespace for the files app
		 * @namespace OCA.Files
		 */
		OCA.Files = {};
	}

	/**
	 * @namespace OCA.Files.App
	 */
	OCA.Files.App = {
		/**
		 * Navigation control
		 *
		 * @member {OCA.Files.Navigation}
		 */
		navigation: null,

		/**
		 * File list for the "All files" section.
		 *
		 * @member {OCA.Files.FileList}
		 */
		fileList: null,

		/**
		 * Backbone model for storing files preferences
		 */
		_filesConfig: null,

		/**
		 * Initializes the files app
		 */
		initialize: function() {
			this.navigation = new OCA.Files.Navigation($('#app-navigation'));
			this.$showHiddenFiles = $('input#showhiddenfilesToggle');
			var showHidden = $('#showHiddenFiles').val() === "1";
			this.$showHiddenFiles.prop('checked', showHidden);
			if ($('#fileNotFound').val() === "1") {
				OC.Notification.show(t('files', 'File could not be found'), {type: 'error'});
			}

			this._filesConfig = new OC.Backbone.Model({
				showhidden: showHidden
			});

			var urlParams = OC.Util.History.parseUrlQuery();
			var fileActions = new OCA.Files.FileActions();
			// default actions
			fileActions.registerDefaultActions();
			// legacy actions
			fileActions.merge(window.FileActions);
			// regular actions
			fileActions.merge(OCA.Files.fileActions);

			this._onActionsUpdated = _.bind(this._onActionsUpdated, this);
			OCA.Files.fileActions.on('setDefault.app-files', this._onActionsUpdated);
			OCA.Files.fileActions.on('registerAction.app-files', this._onActionsUpdated);
			window.FileActions.on('setDefault.app-files', this._onActionsUpdated);
			window.FileActions.on('registerAction.app-files', this._onActionsUpdated);

			this.files = OCA.Files.Files;

			// TODO: ideally these should be in a separate class / app (the embedded "all files" app)
			this.fileList = new OCA.Files.FileList(
				$('#app-content-files'), {
					scrollContainer: $('#app-content'),
					dragOptions: dragOptions,
					folderDropOptions: folderDropOptions,
					fileActions: fileActions,
					allowLegacyActions: true,
					scrollTo: urlParams.scrollto,
					filesClient: OC.Files.getClient(),
					sorting: {
						mode: $('#defaultFileSorting').val(),
						direction: $('#defaultFileSortingDirection').val()
					},
					config: this._filesConfig,
					enableUpload: true,
					maxChunkSize: OC.appConfig.files && OC.appConfig.files.max_chunk_size
				}
			);
			this.files.initialize();

			// for backward compatibility, the global FileList will
			// refer to the one of the "files" view
			window.FileList = this.fileList;

			OC.Plugins.attach('OCA.Files.App', this);

			this._setupEvents();
			// trigger URL change event handlers
			this._onPopState(urlParams);

			$('#quota.has-tooltip').tooltip({
				placement: 'top'
			});

			this._debouncedPersistShowHiddenFilesState = _.debounce(this._persistShowHiddenFilesState, 1200);
		},

		/**
		 * Destroy the app
		 */
		destroy: function() {
			this.navigation = null;
			this.fileList.destroy();
			this.fileList = null;
			this.files = null;
			OCA.Files.fileActions.off('setDefault.app-files', this._onActionsUpdated);
			OCA.Files.fileActions.off('registerAction.app-files', this._onActionsUpdated);
			window.FileActions.off('setDefault.app-files', this._onActionsUpdated);
			window.FileActions.off('registerAction.app-files', this._onActionsUpdated);
		},

		_onActionsUpdated: function(ev, newAction) {
			// forward new action to the file list
			if (ev.action) {
				this.fileList.fileActions.registerAction(ev.action);
			} else if (ev.defaultAction) {
				this.fileList.fileActions.setDefault(
					ev.defaultAction.mime,
					ev.defaultAction.name
				);
			}
		},

		/**
		 * Returns the container of the currently visible app.
		 *
		 * @return app container
		 */
		getCurrentAppContainer: function() {
			return this.navigation.getActiveContainer();
		},

		/**
		 * Sets the currently active view
		 * @param viewId view id
		 */
		setActiveView: function(viewId, options) {
			this.navigation.setActiveItem(viewId, options);
		},

		/**
		 * Returns the view id of the currently active view
		 * @return view id
		 */
		getActiveView: function() {
			return this.navigation.getActiveItem();
		},

		/**
		 *
		 * @returns {Backbone.Model}
		 */
		getFilesConfig: function() {
			return this._filesConfig;
		},

		/**
		 * Setup events based on URL changes
		 */
		_setupEvents: function() {
			OC.Util.History.addOnPopStateHandler(_.bind(this._onPopState, this));

			// detect when app changed their current directory
			$('#app-content').delegate('>div', 'changeDirectory', _.bind(this._onDirectoryChanged, this));
			$('#app-content').delegate('>div', 'afterChangeDirectory', _.bind(this._onAfterDirectoryChanged, this));
			$('#app-content').delegate('>div', 'changeViewerMode', _.bind(this._onChangeViewerMode, this));

			$('#app-navigation').on('itemChanged', _.bind(this._onNavigationChanged, this));
			this.$showHiddenFiles.on('change', _.bind(this._onShowHiddenFilesChange, this));
		},

		/**
		 * Toggle showing hidden files according to the settings checkbox
		 *
		 * @returns {undefined}
		 */
		_onShowHiddenFilesChange: function() {
			var show = this.$showHiddenFiles.is(':checked');
			this._filesConfig.set('showhidden', show);
			this._debouncedPersistShowHiddenFilesState();
		},

		/**
		 * Persist show hidden preference on ther server
		 *
		 * @returns {undefined}
		 */
		_persistShowHiddenFilesState: function() {
			var show = this._filesConfig.get('showhidden');
			$.post(OC.generateUrl('/apps/files/api/v1/showhidden'), {
				show: show
			});
		},

		/**
		 * Event handler for when the current navigation item has changed
		 */
		_onNavigationChanged: function(e) {
			var params;
			if (e && e.itemId) {
				params = {
					view: e.itemId,
					dir: '/'
				};
				this._changeUrl(params.view, params.dir);
				OC.Apps.hideAppSidebar($('.detailsView'));
				this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));
			}
		},

		/**
		 * Event handler for when an app notified that its directory changed
		 */
		_onDirectoryChanged: function(e) {
			if (e.dir) {
				this._changeUrl(this.navigation.getActiveItem(), e.dir, e.fileId);
			}
		},

		/**
		 * Event handler for when an app notified that its directory changed
		 */
		_onAfterDirectoryChanged: function(e) {
			if (e.dir && e.fileId) {
				this._changeUrl(this.navigation.getActiveItem(), e.dir, e.fileId);
			}
		},

		/**
		 * Event handler for when an app notifies that it needs space
		 * for viewer mode.
		 */
		_onChangeViewerMode: function(e) {
			var state = !!e.viewerModeEnabled;
			if (e.viewerModeEnabled) {
				OC.Apps.hideAppSidebar($('.detailsView'));
			}
			$('#app-navigation').toggleClass('hidden', state);
			$('.app-files').toggleClass('viewer-mode no-sidebar', state);
		},

		/**
		 * Event handler for when the URL changed
		 */
		_onPopState: function(params) {
			params = _.extend({
				dir: '/',
				view: 'files'
			}, params);
			var lastId = this.navigation.getActiveItem();
			if (!this.navigation.itemExists(params.view)) {
				params.view = 'files';
			}
			this.navigation.setActiveItem(params.view, {silent: true});
			if (lastId !== this.navigation.getActiveItem()) {
				this.navigation.getActiveContainer().trigger(new $.Event('show'));
			}
			this.navigation.getActiveContainer().trigger(new $.Event('urlChanged', params));
		},

		/**
		 * Encode URL params into a string, except for the "dir" attribute
		 * that gets encoded as path where "/" is not encoded
		 *
		 * @param {Object.<string>} params
		 * @return {string} encoded params
		 */
		_makeUrlParams: function(params) {
			var dir = params.dir;
			delete params.dir;
			return 'dir=' + OC.encodePath(dir) + '&' + OC.buildQueryString(params);
		},

		/**
		 * Change the URL to point to the given dir and view
		 */
		_changeUrl: function(view, dir, fileId) {
			var params = {dir: dir};
			if (view !== 'files') {
				params.view = view;
			} else if (fileId) {
				params.fileid = fileId;
			}
			var currentParams = OC.Util.History.parseUrlQuery();
			if (currentParams.dir === params.dir && currentParams.view === params.view && currentParams.fileid !== params.fileid) {
				// if only fileid changed or was added, replace instead of push
				OC.Util.History.replaceState(this._makeUrlParams(params));
			} else {
				OC.Util.History.pushState(this._makeUrlParams(params));
			}
		}
	};
})();

$(document).ready(function() {
	// wait for other apps/extensions to register their event handlers and file actions
	// in the "ready" clause
	_.defer(function() {
		OCA.Files.App.initialize();
	});
});


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/**
 * The file upload code uses several hooks to interact with blueimps jQuery file upload library:
 * 1. the core upload handling hooks are added when initializing the plugin,
 * 2. if the browser supports progress events they are added in a separate set after the initialization
 * 3. every app can add it's own triggers for fileupload
 *    - files adds d'n'd handlers and also reacts to done events to add new rows to the filelist
 *    - TODO pictures upload button
 *    - TODO music upload button
 */

/* global jQuery, humanFileSize, md5 */

/**
 * File upload object
 *
 * @class OC.FileUpload
 * @classdesc
 *
 * Represents a file upload
 *
 * @param {OC.Uploader} uploader uploader
 * @param {Object} data blueimp data
 */
OC.FileUpload = function(uploader, data) {
	this.uploader = uploader;
	this.data = data;
	var path = '';
	if (this.uploader.fileList) {
		path = OC.joinPaths(this.uploader.fileList.getCurrentDirectory(), this.getFile().name);
	} else {
		path = this.getFile().name;
	}
	this.id = 'web-file-upload-' + md5(path) + '-' + (new Date()).getTime();
};
OC.FileUpload.CONFLICT_MODE_DETECT = 0;
OC.FileUpload.CONFLICT_MODE_OVERWRITE = 1;
OC.FileUpload.CONFLICT_MODE_AUTORENAME = 2;
OC.FileUpload.prototype = {

	/**
	 * Unique upload id
	 *
	 * @type string
	 */
	id: null,

	/**
	 * Upload element
	 *
	 * @type Object
	 */
	$uploadEl: null,

	/**
	 * Target folder
	 *
	 * @type string
	 */
	_targetFolder: '',

	/**
	 * @type int
	 */
	_conflictMode: OC.FileUpload.CONFLICT_MODE_DETECT,

	/**
	 * New name from server after autorename
	 *
	 * @type String
	 */
	_newName: null,

	/**
	 * Returns the unique upload id
	 *
	 * @return string
	 */
	getId: function() {
		return this.id;
	},

	/**
	 * Returns the file to be uploaded
	 *
	 * @return {File} file
	 */
	getFile: function() {
		return this.data.files[0];
	},

	/**
	 * Return the final filename.
	 *
	 * @return {String} file name
	 */
	getFileName: function() {
		// autorenamed name
		if (this._newName) {
			return this._newName;
		}
		return this.getFile().name;
	},

	setTargetFolder: function(targetFolder) {
		this._targetFolder = targetFolder;
	},

	getTargetFolder: function() {
		return this._targetFolder;
	},

	/**
	 * Get full path for the target file, including relative path,
	 * without the file name.
	 *
	 * @return {String} full path
	 */
	getFullPath: function() {
		return OC.joinPaths(this._targetFolder, this.getFile().relativePath || '');
	},

	/**
	 * Get full path for the target file,
	 * including relative path and file name.
	 *
	 * @return {String} full path
	 */
	getFullFilePath: function() {
		return OC.joinPaths(this.getFullPath(), this.getFile().name);
	},

	/**
	 * Returns conflict resolution mode.
	 *
	 * @return {int} conflict mode
	 */
	getConflictMode: function() {
		return this._conflictMode || OC.FileUpload.CONFLICT_MODE_DETECT;
	},

	/**
	 * Set conflict resolution mode.
	 * See CONFLICT_MODE_* constants.
	 *
	 * @param {int} mode conflict mode
	 */
	setConflictMode: function(mode) {
		this._conflictMode = mode;
	},

	deleteUpload: function() {
		delete this.data.jqXHR;
	},

	/**
	 * Trigger autorename and append "(2)".
	 * Multiple calls will increment the appended number.
	 */
	autoRename: function() {
		var name = this.getFile().name;
		if (!this._renameAttempt) {
			this._renameAttempt = 1;
		}

		var dotPos = name.lastIndexOf('.');
		var extPart = '';
		if (dotPos > 0) {
			this._newName = name.substr(0, dotPos);
			extPart = name.substr(dotPos);
		} else {
			this._newName = name;
		}

		// generate new name
		this._renameAttempt++;
		this._newName = this._newName + ' (' + this._renameAttempt + ')' + extPart;
	},

	/**
	 * Submit the upload
	 */
	submit: function() {
		var self = this;
		var data = this.data;
		var file = this.getFile();

		// it was a folder upload, so make sure the parent directory exists alrady
		var folderPromise;
		if (file.relativePath) {
			folderPromise = this.uploader.ensureFolderExists(this.getFullPath());
		} else {
			folderPromise = $.Deferred().resolve().promise();
		}

		if (this.uploader.fileList) {
			this.data.url = this.uploader.fileList.getUploadUrl(this.getFileName(), this.getFullPath());
		}

		if (!this.data.headers) {
			this.data.headers = {};
		}

		// webdav without multipart
		this.data.multipart = false;
		this.data.type = 'PUT';

		delete this.data.headers['If-None-Match'];
		if (this._conflictMode === OC.FileUpload.CONFLICT_MODE_DETECT
			|| this._conflictMode === OC.FileUpload.CONFLICT_MODE_AUTORENAME) {
			this.data.headers['If-None-Match'] = '*';
		}

		var userName = this.uploader.davClient.getUserName();
		var password = this.uploader.davClient.getPassword();
		if (userName) {
			// copy username/password from DAV client
			this.data.headers['Authorization'] =
				'Basic ' + btoa(userName + ':' + (password || ''));
		}

		var chunkFolderPromise;
		if ($.support.blobSlice
			&& this.uploader.fileUploadParam.maxChunkSize
			&& this.getFile().size > this.uploader.fileUploadParam.maxChunkSize
		) {
			data.isChunked = true;
			chunkFolderPromise = this.uploader.davClient.createDirectory(
				'uploads/' + OC.getCurrentUser().uid + '/' + this.getId()
			);
			// TODO: if fails, it means same id already existed, need to retry
		} else {
			chunkFolderPromise = $.Deferred().resolve().promise();
		}

		// wait for creation of the required directory before uploading
		$.when(folderPromise, chunkFolderPromise).then(function() {
			data.submit();
		}, function() {
			self.abort();
		});

	},

	/**
	 * Process end of transfer
	 */
	done: function() {
		if (!this.data.isChunked) {
			return $.Deferred().resolve().promise();
		}

		var uid = OC.getCurrentUser().uid;
		var mtime = this.getFile().lastModified;
		var size = this.getFile().size;
		var headers = {};
		if (mtime) {
			headers['X-OC-Mtime'] = mtime / 1000;
		}
		if (size) {
			headers['OC-Total-Length'] = size;

		}

		return this.uploader.davClient.move(
			'uploads/' + uid + '/' + this.getId() + '/.file',
			'files/' + uid + '/' + OC.joinPaths(this.getFullPath(), this.getFileName()),
			true,
			headers
		);
	},

	_deleteChunkFolder: function() {
		// delete transfer directory for this upload
		this.uploader.davClient.remove(
			'uploads/' + OC.getCurrentUser().uid + '/' + this.getId()
		);
	},

	/**
	 * Abort the upload
	 */
	abort: function() {
		if (this.data.isChunked) {
			this._deleteChunkFolder();
		}
		this.data.abort();
		this.deleteUpload();
	},

	/**
	 * Fail the upload
	 */
	fail: function() {
		this.deleteUpload();
		if (this.data.isChunked) {
			this._deleteChunkFolder();
		}
	},

	/**
	 * Returns the server response
	 *
	 * @return {Object} response
	 */
	getResponse: function() {
		var response = this.data.response();
		if (response.errorThrown) {
			// attempt parsing Sabre exception is available
			var xml = response.jqXHR.responseXML;
			if (xml.documentElement.localName === 'error' && xml.documentElement.namespaceURI === 'DAV:') {
				var messages = xml.getElementsByTagNameNS('http://sabredav.org/ns', 'message');
				var exceptions = xml.getElementsByTagNameNS('http://sabredav.org/ns', 'exception');
				if (messages.length) {
					response.message = messages[0].textContent;
				}
				if (exceptions.length) {
					response.exception = exceptions[0].textContent;
				}
				return response;
			}
		}

		if (typeof response.result !== 'string' && response.result) {
			//fetch response from iframe
			response = $.parseJSON(response.result[0].body.innerText);
			if (!response) {
				// likely due to internal server error
				response = {status: 500};
			}
		} else {
			response = response.result;
		}
		return response;
	},

	/**
	 * Returns the status code from the response
	 *
	 * @return {int} status code
	 */
	getResponseStatus: function() {
		if (this.uploader.isXHRUpload()) {
			var xhr = this.data.response().jqXHR;
			if (xhr) {
				return xhr.status;
			}
			return null;
		}
		return this.getResponse().status;
	},

	/**
	 * Returns the response header by name
	 *
	 * @param {String} headerName header name
	 * @return {Array|String} response header value(s)
	 */
	getResponseHeader: function(headerName) {
		headerName = headerName.toLowerCase();
		if (this.uploader.isXHRUpload()) {
			return this.data.response().jqXHR.getResponseHeader(headerName);
		}

		var headers = this.getResponse().headers;
		if (!headers) {
			return null;
		}

		var value =  _.find(headers, function(value, key) {
			return key.toLowerCase() === headerName;
		});
		if (_.isArray(value) && value.length === 1) {
			return value[0];
		}
		return value;
	}
};

/**
 * keeps track of uploads in progress and implements callbacks for the conflicts dialog
 * @namespace
 */

OC.Uploader = function() {
	this.init.apply(this, arguments);
};

OC.Uploader.prototype = _.extend({
	/**
	 * @type Array<OC.FileUpload>
	 */
	_uploads: {},

	/**
	 * List of directories known to exist.
	 *
	 * Key is the fullpath and value is boolean, true meaning that the directory
	 * was already created so no need to create it again.
	 */
	_knownDirs: {},

	/**
	 * @type OCA.Files.FileList
	 */
	fileList: null,

	/**
	 * @type OC.Files.Client
	 */
	filesClient: null,

	/**
	 * Webdav client pointing at the root "dav" endpoint
	 *
	 * @type OC.Files.Client
	 */
	davClient: null,

	/**
	 * Function that will allow us to know if Ajax uploads are supported
	 * @link https://github.com/New-Bamboo/example-ajax-upload/blob/master/public/index.html
	 * also see article @link http://blog.new-bamboo.co.uk/2012/01/10/ridiculously-simple-ajax-uploads-with-formdata
	 */
	_supportAjaxUploadWithProgress: function() {
		if (window.TESTING) {
			return true;
		}
		return supportFileAPI() && supportAjaxUploadProgressEvents() && supportFormData();

		// Is the File API supported?
		function supportFileAPI() {
			var fi = document.createElement('INPUT');
			fi.type = 'file';
			return 'files' in fi;
		}

		// Are progress events supported?
		function supportAjaxUploadProgressEvents() {
			var xhr = new XMLHttpRequest();
			return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
		}

		// Is FormData supported?
		function supportFormData() {
			return !! window.FormData;
		}
	},

	/**
	 * Returns whether an XHR upload will be used
	 *
	 * @return {bool} true if XHR upload will be used,
	 * false for iframe upload
	 */
	isXHRUpload: function () {
		return !this.fileUploadParam.forceIframeTransport &&
			((!this.fileUploadParam.multipart && $.support.xhrFileUpload) ||
			$.support.xhrFormDataFileUpload);
	},

	/**
	 * Makes sure that the upload folder and its parents exists
	 *
	 * @param {String} fullPath full path
	 * @return {Promise} promise that resolves when all parent folders
	 * were created
	 */
	ensureFolderExists: function(fullPath) {
		if (!fullPath || fullPath === '/') {
			return $.Deferred().resolve().promise();
		}

		// remove trailing slash
		if (fullPath.charAt(fullPath.length - 1) === '/') {
			fullPath = fullPath.substr(0, fullPath.length - 1);
		}

		var self = this;
		var promise = this._knownDirs[fullPath];

		if (this.fileList) {
			// assume the current folder exists
			this._knownDirs[this.fileList.getCurrentDirectory()] = $.Deferred().resolve().promise();
		}

		if (!promise) {
			var deferred = new $.Deferred();
			promise = deferred.promise();
			this._knownDirs[fullPath] = promise;

			// make sure all parents already exist
			var parentPath = OC.dirname(fullPath);
			var parentPromise = this._knownDirs[parentPath];
			if (!parentPromise) {
				parentPromise = this.ensureFolderExists(parentPath);
			}

			parentPromise.then(function() {
				self.filesClient.createDirectory(fullPath).always(function(status) {
					// 405 is expected if the folder already exists
					if ((status >= 200 && status < 300) || status === 405) {
						self.trigger('createdfolder', fullPath);
						deferred.resolve();
						return;
					}
					OC.Notification.show(t('files', 'Could not create folder "{dir}"', {dir: fullPath}), {type: 'error'});
					deferred.reject();
				});
			}, function() {
				deferred.reject();
			});
		}

		return promise;
	},

	/**
	 * Submit the given uploads
	 *
	 * @param {Array} array of uploads to start
	 */
	submitUploads: function(uploads) {
		var self = this;
		_.each(uploads, function(upload) {
			self._uploads[upload.data.uploadId] = upload;
			upload.submit();
		});
	},

	/**
	 * Show conflict for the given file object
	 *
	 * @param {OC.FileUpload} file upload object
	 */
	showConflict: function(fileUpload) {
		//show "file already exists" dialog
		var self = this;
		var file = fileUpload.getFile();
		// already attempted autorename but the server said the file exists ? (concurrently added)
		if (fileUpload.getConflictMode() === OC.FileUpload.CONFLICT_MODE_AUTORENAME) {
			// attempt another autorename, defer to let the current callback finish
			_.defer(function() {
				self.onAutorename(fileUpload);
			});
			return;
		}
		// retrieve more info about this file
		this.filesClient.getFileInfo(fileUpload.getFullFilePath()).then(function(status, fileInfo) {
			var original = fileInfo;
			var replacement = file;
			original.directory = original.path;
			OC.dialogs.fileexists(fileUpload, original, replacement, self);
		});
	},
	/**
	 * cancels all uploads
	 */
	cancelUploads:function() {
		this.log('canceling uploads');
		jQuery.each(this._uploads, function(i, upload) {
			upload.abort();
		});
		this.clear();
	},
	/**
	 * Clear uploads
	 */
	clear: function() {
		this._uploads = {};
		this._knownDirs = {};
	},
	/**
	 * Returns an upload by id
	 *
	 * @param {int} data uploadId
	 * @return {OC.FileUpload} file upload
	 */
	getUpload: function(data) {
		if (_.isString(data)) {
			return this._uploads[data];
		} else if (data.uploadId && this._uploads[data.uploadId]) {
			this._uploads[data.uploadId].data = data;
			return this._uploads[data.uploadId];
		}
		return null;
	},

	showUploadCancelMessage: _.debounce(function() {
		OC.Notification.show(t('files', 'Upload cancelled.'), {timeout : 7, type: 'error'});
	}, 500),
	/**
	 * callback for the conflicts dialog
	 */
	onCancel:function() {
		this.cancelUploads();
	},
	/**
	 * callback for the conflicts dialog
	 * calls onSkip, onReplace or onAutorename for each conflict
	 * @param {object} conflicts - list of conflict elements
	 */
	onContinue:function(conflicts) {
		var self = this;
		//iterate over all conflicts
		jQuery.each(conflicts, function (i, conflict) {
			conflict = $(conflict);
			var keepOriginal = conflict.find('.original input[type="checkbox"]:checked').length === 1;
			var keepReplacement = conflict.find('.replacement input[type="checkbox"]:checked').length === 1;
			if (keepOriginal && keepReplacement) {
				// when both selected -> autorename
				self.onAutorename(conflict.data('data'));
			} else if (keepReplacement) {
				// when only replacement selected -> overwrite
				self.onReplace(conflict.data('data'));
			} else {
				// when only original seleted -> skip
				// when none selected -> skip
				self.onSkip(conflict.data('data'));
			}
		});
	},
	/**
	 * handle skipping an upload
	 * @param {OC.FileUpload} upload
	 */
	onSkip:function(upload) {
		this.log('skip', null, upload);
		upload.deleteUpload();
	},
	/**
	 * handle replacing a file on the server with an uploaded file
	 * @param {FileUpload} data
	 */
	onReplace:function(upload) {
		this.log('replace', null, upload);
		upload.setConflictMode(OC.FileUpload.CONFLICT_MODE_OVERWRITE);
		this.submitUploads([upload]);
	},
	/**
	 * handle uploading a file and letting the server decide a new name
	 * @param {object} upload
	 */
	onAutorename:function(upload) {
		this.log('autorename', null, upload);
		upload.setConflictMode(OC.FileUpload.CONFLICT_MODE_AUTORENAME);

		do {
			upload.autoRename();
			// if file known to exist on the client side, retry
		} while (this.fileList && this.fileList.inList(upload.getFileName()));

		// resubmit upload
		this.submitUploads([upload]);
	},
	_trace:false, //TODO implement log handler for JS per class?
	log:function(caption, e, data) {
		if (this._trace) {
			console.log(caption);
			console.log(data);
		}
	},
	/**
	 * checks the list of existing files prior to uploading and shows a simple dialog to choose
	 * skip all, replace all or choose which files to keep
	 *
	 * @param {array} selection of files to upload
	 * @param {object} callbacks - object with several callback methods
	 * @param {function} callbacks.onNoConflicts
	 * @param {function} callbacks.onSkipConflicts
	 * @param {function} callbacks.onReplaceConflicts
	 * @param {function} callbacks.onChooseConflicts
	 * @param {function} callbacks.onCancel
	 */
	checkExistingFiles: function (selection, callbacks) {
		var fileList = this.fileList;
		var conflicts = [];
		// only keep non-conflicting uploads
		selection.uploads = _.filter(selection.uploads, function(upload) {
			var file = upload.getFile();
			if (file.relativePath) {
				// can't check in subfolder contents
				return true;
			}
			if (!fileList) {
				// no list to check against
				return true;
			}
			var fileInfo = fileList.findFile(file.name);
			if (fileInfo) {
				conflicts.push([
					// original
					_.extend(fileInfo, {
						directory: fileInfo.directory || fileInfo.path || fileList.getCurrentDirectory()
					}),
					// replacement (File object)
					upload
				]);
				return false;
			}
			return true;
		});
		if (conflicts.length) {
			// wait for template loading
			OC.dialogs.fileexists(null, null, null, this).done(function() {
				_.each(conflicts, function(conflictData) {
					OC.dialogs.fileexists(conflictData[1], conflictData[0], conflictData[1].getFile(), this);
				});
			});
		}

		// upload non-conflicting files
		// note: when reaching the server they might still meet conflicts
		// if the folder was concurrently modified, these will get added
		// to the already visible dialog, if applicable
		callbacks.onNoConflicts(selection);
	},

	_hideProgressBar: function() {
		var self = this;
		$('#uploadprogresswrapper .stop').fadeOut();
		$('#uploadprogressbar').fadeOut(function() {
			self.$uploadEl.trigger(new $.Event('resized'));
		});
	},

	_showProgressBar: function() {
		$('#uploadprogressbar').fadeIn();
		this.$uploadEl.trigger(new $.Event('resized'));
	},

	/**
	 * Returns whether the given file is known to be a received shared file
	 *
	 * @param {Object} file file
	 * @return {bool} true if the file is a shared file
	 */
	_isReceivedSharedFile: function(file) {
		if (!window.FileList) {
			return false;
		}
		var $tr = window.FileList.findFileEl(file.name);
		if (!$tr.length) {
			return false;
		}

		return ($tr.attr('data-mounttype') === 'shared-root' && $tr.attr('data-mime') !== 'httpd/unix-directory');
	},

	/**
	 * Initialize the upload object
	 *
	 * @param {Object} $uploadEl upload element
	 * @param {Object} options
	 * @param {OCA.Files.FileList} [options.fileList] file list object
	 * @param {OC.Files.Client} [options.filesClient] files client object
	 * @param {Object} [options.dropZone] drop zone for drag and drop upload
	 */
	init: function($uploadEl, options) {
		var self = this;

		options = options || {};

		this.fileList = options.fileList;
		this.filesClient = options.filesClient || OC.Files.getClient();
		this.davClient = new OC.Files.Client({
			host: this.filesClient.getHost(),
			root: OC.linkToRemoteBase('dav'),
			useHTTPS: OC.getProtocol() === 'https',
			userName: this.filesClient.getUserName(),
			password: this.filesClient.getPassword()
		});

		$uploadEl = $($uploadEl);
		this.$uploadEl = $uploadEl;

		if ($uploadEl.exists()) {
			$('#uploadprogresswrapper .stop').on('click', function() {
				self.cancelUploads();
			});

			this.fileUploadParam = {
				type: 'PUT',
				dropZone: options.dropZone, // restrict dropZone to content div
				autoUpload: false,
				sequentialUploads: true,
				//singleFileUploads is on by default, so the data.files array will always have length 1
				/**
				 * on first add of every selection
				 * - check all files of originalFiles array with files in dir
				 * - on conflict show dialog
				 *   - skip all -> remember as single skip action for all conflicting files
				 *   - replace all -> remember as single replace action for all conflicting files
				 *   - choose -> show choose dialog
				 *     - mark files to keep
				 *       - when only existing -> remember as single skip action
				 *       - when only new -> remember as single replace action
				 *       - when both -> remember as single autorename action
				 * - start uploading selection
				 * @param {object} e
				 * @param {object} data
				 * @returns {boolean}
				 */
				add: function(e, data) {
					self.log('add', e, data);
					var that = $(this), freeSpace;

					var upload = new OC.FileUpload(self, data);
					// can't link directly due to jQuery not liking cyclic deps on its ajax object
					data.uploadId = upload.getId();

					// we need to collect all data upload objects before
					// starting the upload so we can check their existence
					// and set individual conflict actions. Unfortunately,
					// there is only one variable that we can use to identify
					// the selection a data upload is part of, so we have to
					// collect them in data.originalFiles turning
					// singleFileUploads off is not an option because we want
					// to gracefully handle server errors like 'already exists'

					// create a container where we can store the data objects
					if ( ! data.originalFiles.selection ) {
						// initialize selection and remember number of files to upload
						data.originalFiles.selection = {
							uploads: [],
							filesToUpload: data.originalFiles.length,
							totalBytes: 0
						};
					}
					// TODO: move originalFiles to a separate container, maybe inside OC.Upload
					var selection = data.originalFiles.selection;

					// add uploads
					if ( selection.uploads.length < selection.filesToUpload ) {
						// remember upload
						selection.uploads.push(upload);
					}

					//examine file
					var file = upload.getFile();
					try {
						// FIXME: not so elegant... need to refactor that method to return a value
						Files.isFileNameValid(file.name);
					}
					catch (errorMessage) {
						data.textStatus = 'invalidcharacters';
						data.errorThrown = errorMessage;
					}

					if (data.targetDir) {
						upload.setTargetFolder(data.targetDir);
						delete data.targetDir;
					}

					// in case folder drag and drop is not supported file will point to a directory
					// http://stackoverflow.com/a/20448357
					if ( ! file.type && file.size % 4096 === 0 && file.size <= 102400) {
						var dirUploadFailure = false;
						try {
							var reader = new FileReader();
							reader.readAsBinaryString(file);
						} catch (NS_ERROR_FILE_ACCESS_DENIED) {
							//file is a directory
							dirUploadFailure = true;
						}

						if (dirUploadFailure) {
							data.textStatus = 'dirorzero';
							data.errorThrown = t('files',
								'Unable to upload {filename} as it is a directory or has 0 bytes',
								{filename: file.name}
							);
						}
					}

					// only count if we're not overwriting an existing shared file
					if (self._isReceivedSharedFile(file)) {
						file.isReceivedShare = true;
					} else {
						// add size
						selection.totalBytes += file.size;
					}

					// check free space
					freeSpace = $('#free_space').val();
					if (freeSpace >= 0 && selection.totalBytes > freeSpace) {
						data.textStatus = 'notenoughspace';
						data.errorThrown = t('files',
							'Not enough free space, you are uploading {size1} but only {size2} is left', {
							'size1': humanFileSize(selection.totalBytes),
							'size2': humanFileSize($('#free_space').val())
						});
					}

					// end upload for whole selection on error
					if (data.errorThrown) {
						// trigger fileupload fail handler
						var fu = that.data('blueimp-fileupload') || that.data('fileupload');
						fu._trigger('fail', e, data);
						return false; //don't upload anything
					}

					// check existing files when all is collected
					if ( selection.uploads.length >= selection.filesToUpload ) {

						//remove our selection hack:
						delete data.originalFiles.selection;

						var callbacks = {

							onNoConflicts: function (selection) {
								self.submitUploads(selection.uploads);
							},
							onSkipConflicts: function (selection) {
								//TODO mark conflicting files as toskip
							},
							onReplaceConflicts: function (selection) {
								//TODO mark conflicting files as toreplace
							},
							onChooseConflicts: function (selection) {
								//TODO mark conflicting files as chosen
							},
							onCancel: function (selection) {
								$.each(selection.uploads, function(i, upload) {
									upload.abort();
								});
							}
						};

						self.checkExistingFiles(selection, callbacks);

					}

					return true; // continue adding files
				},
				/**
				 * called after the first add, does NOT have the data param
				 * @param {object} e
				 */
				start: function(e) {
					self.log('start', e, null);
					//hide the tooltip otherwise it covers the progress bar
					$('#upload').tooltip('hide');
				},
				fail: function(e, data) {
					var upload = self.getUpload(data);
					var status = null;
					if (upload) {
						status = upload.getResponseStatus();
					}
					self.log('fail', e, upload);
					self._hideProgressBar();

					if (data.textStatus === 'abort') {
						self.showUploadCancelMessage();
					} else if (status === 412) {
						// file already exists
						self.showConflict(upload);
					} else if (status === 404) {
						// target folder does not exist any more
						OC.Notification.show(t('files', 'Target folder "{dir}" does not exist any more', {dir: upload.getFullPath()} ), {type: 'error'});
						self.cancelUploads();
					} else if (status === 507) {
						// not enough space
						OC.Notification.show(t('files', 'Not enough free space'), {type: 'error'});
						self.cancelUploads();
					} else {
						// HTTP connection problem or other error
						var message = '';
						if (upload) {
							var response = upload.getResponse();
							message = response.message;
						}
						OC.Notification.show(message || data.errorThrown, {type: 'error'});
					}

					if (upload) {
						upload.fail();
					}
				},
				/**
				 * called for every successful upload
				 * @param {object} e
				 * @param {object} data
				 */
				done:function(e, data) {
					var upload = self.getUpload(data);
					var that = $(this);
					self.log('done', e, upload);

					var status = upload.getResponseStatus();
					if (status < 200 || status >= 300) {
						// trigger fail handler
						var fu = that.data('blueimp-fileupload') || that.data('fileupload');
						fu._trigger('fail', e, data);
						return;
					}
				},
				/**
				 * called after last upload
				 * @param {object} e
				 * @param {object} data
				 */
				stop: function(e, data) {
					self.log('stop', e, data);
				}
			};

			if (options.maxChunkSize) {
				this.fileUploadParam.maxChunkSize = options.maxChunkSize;
			}

			// initialize jquery fileupload (blueimp)
			var fileupload = this.$uploadEl.fileupload(this.fileUploadParam);

			if (this._supportAjaxUploadWithProgress()) {
				//remaining time
				var lastUpdate, lastSize, bufferSize, buffer, bufferIndex, bufferIndex2, bufferTotal;

				// add progress handlers
				fileupload.on('fileuploadadd', function(e, data) {
					self.log('progress handle fileuploadadd', e, data);
					self.trigger('add', e, data);
				});
				// add progress handlers
				fileupload.on('fileuploadstart', function(e, data) {
					self.log('progress handle fileuploadstart', e, data);
					$('#uploadprogresswrapper .stop').show();
					$('#uploadprogresswrapper .label').show();
					$('#uploadprogressbar').progressbar({value: 0});
					$('#uploadprogressbar .ui-progressbar-value').
						html('<em class="label inner"><span class="desktop">'
							+ t('files', 'Uploading …')
							+ '</span><span class="mobile">'
							+ t('files', '…')
							+ '</span></em>');
					$('#uploadprogressbar').tooltip({placement: 'bottom'});
					self._showProgressBar();
					// initial remaining time variables
					lastUpdate   = new Date().getTime();
					lastSize     = 0;
					bufferSize   = 20;
					buffer       = [];
					bufferIndex  = 0;
					bufferIndex2 = 0;
					bufferTotal  = 0;
					for(var i = 0; i < bufferSize; i++){
						buffer[i]  = 0;
					}
					self.trigger('start', e, data);
				});
				fileupload.on('fileuploadprogress', function(e, data) {
					self.log('progress handle fileuploadprogress', e, data);
					//TODO progressbar in row
					self.trigger('progress', e, data);
				});
				fileupload.on('fileuploadprogressall', function(e, data) {
					self.log('progress handle fileuploadprogressall', e, data);
					var progress = (data.loaded / data.total) * 100;
					var thisUpdate = new Date().getTime();
					var diffUpdate = (thisUpdate - lastUpdate)/1000; // eg. 2s
					lastUpdate = thisUpdate;
					var diffSize = data.loaded - lastSize;
					lastSize = data.loaded;
					diffSize = diffSize / diffUpdate; // apply timing factor, eg. 1MiB/2s = 0.5MiB/s, unit is byte per second
					var remainingSeconds = ((data.total - data.loaded) / diffSize);
					if(remainingSeconds >= 0) {
						bufferTotal = bufferTotal - (buffer[bufferIndex]) + remainingSeconds;
						buffer[bufferIndex] = remainingSeconds; //buffer to make it smoother
						bufferIndex = (bufferIndex + 1) % bufferSize;
						bufferIndex2++;
					}
					var smoothRemainingSeconds;
					if (bufferIndex2 > 0 && bufferIndex2 < 20) {
						smoothRemainingSeconds = bufferTotal / bufferIndex2;
					} else if (bufferSize > 0) {
						smoothRemainingSeconds = bufferTotal / bufferSize;
					} else {
						smoothRemainingSeconds = 1;
					}

					var h = moment.duration(smoothRemainingSeconds, "seconds").humanize();
					if (!(smoothRemainingSeconds >= 0 && smoothRemainingSeconds < 14400)) {
						// show "Uploading ..." for durations longer than 4 hours
						h = t('files', 'Uploading …');
					}
					$('#uploadprogressbar .label .mobile').text(h);
					$('#uploadprogressbar .label .desktop').text(h);
					$('#uploadprogressbar').attr('original-title',
						t('files', '{loadedSize} of {totalSize} ({bitrate})' , {
							loadedSize: humanFileSize(data.loaded),
							totalSize: humanFileSize(data.total),
							bitrate: humanFileSize(data.bitrate / 8) + '/s'
						})
					);
					$('#uploadprogressbar').progressbar('value', progress);
					self.trigger('progressall', e, data);
				});
				fileupload.on('fileuploadstop', function(e, data) {
					self.log('progress handle fileuploadstop', e, data);

					self.clear();
					self.trigger('stop', e, data);
				});
				fileupload.on('fileuploadfail', function(e, data) {
					self.log('progress handle fileuploadfail', e, data);
					//if user pressed cancel hide upload progress bar and cancel button
					if (data.errorThrown === 'abort') {
						self._hideProgressBar();
					}
					self.trigger('fail', e, data);
				});
				var disableDropState = function() {
					$('#app-content').removeClass('file-drag');
					$('.dropping-to-dir').removeClass('dropping-to-dir');
					$('.dir-drop').removeClass('dir-drop');
					$('.icon-filetype-folder-drag-accept').removeClass('icon-filetype-folder-drag-accept');
				};
				var disableClassOnFirefox = _.debounce(function() {
					disableDropState();
				}, 100);
				fileupload.on('fileuploaddragover', function(e){
					$('#app-content').addClass('file-drag');
					// dropping a folder in firefox doesn't cause a drop event
					// this is simulated by simply invoke disabling all classes
					// once no dragover event isn't noticed anymore
					if (/Firefox/i.test(navigator.userAgent)) {
						disableClassOnFirefox();
					}
					$('#emptycontent .icon-folder').addClass('icon-filetype-folder-drag-accept');

					var filerow = $(e.delegatedEvent.target).closest('tr');

					if(!filerow.hasClass('dropping-to-dir')){
						$('.dropping-to-dir .icon-filetype-folder-drag-accept').removeClass('icon-filetype-folder-drag-accept');
						$('.dropping-to-dir').removeClass('dropping-to-dir');
						$('.dir-drop').removeClass('dir-drop');
					}

					if(filerow.attr('data-type') === 'dir'){
						$('#app-content').addClass('dir-drop');
						filerow.addClass('dropping-to-dir');
						filerow.find('.thumbnail').addClass('icon-filetype-folder-drag-accept');
					}
				});
				fileupload.on('fileuploaddragleave fileuploaddrop', function (){
					$('#app-content').removeClass('file-drag');
					$('.dropping-to-dir').removeClass('dropping-to-dir');
					$('.dir-drop').removeClass('dir-drop');
					$('.icon-filetype-folder-drag-accept').removeClass('icon-filetype-folder-drag-accept');
				});

				fileupload.on('fileuploadchunksend', function(e, data) {
					// modify the request to adjust it to our own chunking
					var upload = self.getUpload(data);
					var range = data.contentRange.split(' ')[1];
					var chunkId = range.split('/')[0].split('-')[0];
					data.url = OC.getRootPath() +
						'/remote.php/dav/uploads' +
						'/' + OC.getCurrentUser().uid +
						'/' + upload.getId() +
						'/' + chunkId;
					delete data.contentRange;
					delete data.headers['Content-Range'];
				});
				fileupload.on('fileuploaddone', function(e, data) {
					var upload = self.getUpload(data);
					upload.done().then(function() {
						self._hideProgressBar();
						self.trigger('done', e, upload);
					}).fail(function(status, response) {
						var message = response.message;
						self._hideProgressBar();
						if (status === 507) {
							// not enough space
							OC.Notification.show(message || t('files', 'Not enough free space'), {type: 'error'});
							self.cancelUploads();
						} else if (status === 409) {
							OC.Notification.show(message || t('files', 'Target folder does not exist any more'), {type: 'error'});
						} else {
							OC.Notification.show(message || t('files', 'Error when assembling chunks, status code {status}', {status: status}), {type: 'error'});
						}
						self.trigger('fail', e, data);
					});
				});
				fileupload.on('fileuploaddrop', function(e, data) {
					self.trigger('drop', e, data);
					if (e.isPropagationStopped()) {
						return false;
					}
				});

			}
		}

		//add multiply file upload attribute to all browsers except konqueror (which crashes when it's used)
		if (navigator.userAgent.search(/konqueror/i) === -1) {
			this.$uploadEl.attr('multiple', 'multiple');
		}

		return this.fileUploadParam;
	}
}, OC.Backbone.Events);


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Files */

(function() {

	var TEMPLATE_MENU =
		'<ul>' +
		'<li>' +
		'<label for="file_upload_start" class="menuitem" data-action="upload" title="{{uploadMaxHumanFilesize}}"><span class="svg icon icon-upload"></span><span class="displayname">{{uploadLabel}}</span></label>' +
		'</li>' +
		'{{#each items}}' +
		'<li>' +
		'<a href="#" class="menuitem" data-templatename="{{templateName}}" data-filetype="{{fileType}}" data-action="{{id}}"><span class="icon {{iconClass}} svg"></span><span class="displayname">{{displayName}}</span></a>' +
		'</li>' +
		'{{/each}}' +
		'</ul>';

	var TEMPLATE_FILENAME_FORM =
		'<form class="filenameform">' +
		'<label class="hidden-visually" for="{{cid}}-input-{{fileType}}">{{fileName}}</label>' +
		'<input id="{{cid}}-input-{{fileType}}" type="text" value="{{fileName}}" autocomplete="off" autocapitalize="off">' +
		'</form>';

	/**
	 * Construct a new NewFileMenu instance
	 * @constructs NewFileMenu
	 *
	 * @memberof OCA.Files
	 */
	var NewFileMenu = OC.Backbone.View.extend({
		tagName: 'div',
		// Menu is opened by default because it's rendered on "add-button" click
		className: 'newFileMenu popovermenu bubble menu open menu-left',

		events: {
			'click .menuitem': '_onClickAction'
		},

		/**
		 * @type OCA.Files.FileList
		 */
		fileList: null,

		initialize: function(options) {
			var self = this;
			var $uploadEl = $('#file_upload_start');
			if ($uploadEl.length) {
				$uploadEl.on('fileuploadstart', function() {
					self.trigger('actionPerformed', 'upload');
				});
			} else {
				console.warn('Missing upload element "file_upload_start"');
			}

			this.fileList = options && options.fileList;

			this._menuItems = [{
				id: 'folder',
				displayName: t('files', 'New folder'),
				templateName: t('files', 'New folder'),
				iconClass: 'icon-folder',
				fileType: 'folder',
				actionHandler: function(name) {
					self.fileList.createDirectory(name);
				}
		        }];

			OC.Plugins.attach('OCA.Files.NewFileMenu', this);
		},

		template: function(data) {
			if (!OCA.Files.NewFileMenu._TEMPLATE) {
				OCA.Files.NewFileMenu._TEMPLATE = Handlebars.compile(TEMPLATE_MENU);
			}
			return OCA.Files.NewFileMenu._TEMPLATE(data);
		},

		/**
		 * Event handler whenever an action has been clicked within the menu
		 *
		 * @param {Object} event event object
		 */
		_onClickAction: function(event) {
			var $target = $(event.target);
			if (!$target.hasClass('menuitem')) {
				$target = $target.closest('.menuitem');
			}
			var action = $target.attr('data-action');
			// note: clicking the upload label will automatically
			// set the focus on the "file_upload_start" hidden field
			// which itself triggers the upload dialog.
			// Currently the upload logic is still in file-upload.js and filelist.js
			if (action === 'upload') {
				OC.hideMenus();
			} else {
				event.preventDefault();
				this.$el.find('.menuitem.active').removeClass('active');
				$target.addClass('active');
				this._promptFileName($target);
			}
		},

		_promptFileName: function($target) {
			var self = this;
			if (!OCA.Files.NewFileMenu._TEMPLATE_FORM) {
				OCA.Files.NewFileMenu._TEMPLATE_FORM = Handlebars.compile(TEMPLATE_FILENAME_FORM);
			}

			if ($target.find('form').length) {
				$target.find('input').focus();
				return;
			}

			// discard other forms
			this.$el.find('form').remove();
			this.$el.find('.displayname').removeClass('hidden');

			$target.find('.displayname').addClass('hidden');

			var newName = $target.attr('data-templatename');
			var fileType = $target.attr('data-filetype');
			var $form = $(OCA.Files.NewFileMenu._TEMPLATE_FORM({
				fileName: newName,
				cid: this.cid,
				fileType: fileType
			}));

			//this.trigger('actionPerformed', action);
			$target.append($form);

			// here comes the OLD code
			var $input = $form.find('input');

			var lastPos;
			var checkInput = function () {
				var filename = $input.val();
				try {
					if (!Files.isFileNameValid(filename)) {
						// Files.isFileNameValid(filename) throws an exception itself
					} else if (self.fileList.inList(filename)) {
						throw t('files', '{newName} already exists', {newName: filename}, undefined, {
							escape: false
						});
					} else {
						return true;
					}
				} catch (error) {
					$input.attr('title', error);
					$input.tooltip({placement: 'right', trigger: 'manual'});
					$input.tooltip('fixTitle');
					$input.tooltip('show');
					$input.addClass('error');
				}
				return false;
			};

			// verify filename on typing
			$input.keyup(function() {
				if (checkInput()) {
					$input.tooltip('hide');
					$input.removeClass('error');
				}
			});

			$input.focus();
			// pre select name up to the extension
			lastPos = newName.lastIndexOf('.');
			if (lastPos === -1) {
				lastPos = newName.length;
			}
			$input.selectRange(0, lastPos);

			$form.submit(function(event) {
				event.stopPropagation();
				event.preventDefault();

				if (checkInput()) {
					var newname = $input.val();

					/* Find the right actionHandler that should be called.
					 * Actions is retrieved by using `actionSpec.id` */
					action = _.filter(self._menuItems, function(item) {
						return item.id == $target.attr('data-action');
					}).pop();
					action.actionHandler(newname);

					$form.remove();
					$target.find('.displayname').removeClass('hidden');
					OC.hideMenus();
				}
			});
		},

		/**
		* Add a new item menu entry in the “New” file menu (in
		* last position). By clicking on the item, the
		* `actionHandler` function is called.
		*
		* @param {Object} actionSpec item’s properties
		*/
		addMenuEntry: function(actionSpec) {
			this._menuItems.push({
				id: actionSpec.id,
				displayName: actionSpec.displayName,
				templateName: actionSpec.templateName,
				iconClass: actionSpec.iconClass,
				fileType: actionSpec.fileType,
				actionHandler: actionSpec.actionHandler,
		        });
		},

		/**
		 * Renders the menu with the currently set items
		 */
		render: function() {
			this.$el.html(this.template({
				uploadMaxHumanFileSize: 'TODO',
				uploadLabel: t('files', 'Upload file'),
				items: this._menuItems
			}));
			OC.Util.scaleFixForIE8(this.$('.svg'));
		},

		/**
		 * Displays the menu under the given element
		 *
		 * @param {Object} $target target element
		 */
		showAt: function($target) {
			this.render();
			OC.showMenu(null, this.$el);
		}
	});

	OCA.Files.NewFileMenu = NewFileMenu;

})();


/*
 * jQuery File Upload Plugin 9.12.5
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/* jshint nomen:false */
/* global define, require, window, document, location, Blob, FormData */

;(function (factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // Register as an anonymous AMD module:
        define([
            'jquery',
            'jquery.ui.widget'
        ], factory);
    } else if (typeof exports === 'object') {
        // Node/CommonJS:
        factory(
            require('jquery'),
            require('./vendor/jquery.ui.widget')
        );
    } else {
        // Browser globals:
        factory(window.jQuery);
    }
}(function ($) {
    'use strict';

    // Detect file input support, based on
    // http://viljamis.com/blog/2012/file-upload-support-on-mobile/
    $.support.fileInput = !(new RegExp(
        // Handle devices which give false positives for the feature detection:
        '(Android (1\\.[0156]|2\\.[01]))' +
            '|(Windows Phone (OS 7|8\\.0))|(XBLWP)|(ZuneWP)|(WPDesktop)' +
            '|(w(eb)?OSBrowser)|(webOS)' +
            '|(Kindle/(1\\.0|2\\.[05]|3\\.0))'
    ).test(window.navigator.userAgent) ||
        // Feature detection for all other devices:
        $('<input type="file">').prop('disabled'));

    // The FileReader API is not actually used, but works as feature detection,
    // as some Safari versions (5?) support XHR file uploads via the FormData API,
    // but not non-multipart XHR file uploads.
    // window.XMLHttpRequestUpload is not available on IE10, so we check for
    // window.ProgressEvent instead to detect XHR2 file upload capability:
    $.support.xhrFileUpload = !!(window.ProgressEvent && window.FileReader);
    $.support.xhrFormDataFileUpload = !!window.FormData;

    // Detect support for Blob slicing (required for chunked uploads):
    $.support.blobSlice = window.Blob && (Blob.prototype.slice ||
        Blob.prototype.webkitSlice || Blob.prototype.mozSlice);

    // Helper function to create drag handlers for dragover/dragenter/dragleave:
    function getDragHandler(type) {
        var isDragOver = type === 'dragover';
        return function (e) {
            e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
            var dataTransfer = e.dataTransfer;
            if (dataTransfer && $.inArray('Files', dataTransfer.types) !== -1 &&
                    this._trigger(
                        type,
                        $.Event(type, {delegatedEvent: e})
                    ) !== false) {
                e.preventDefault();
                if (isDragOver) {
                    dataTransfer.dropEffect = 'copy';
                }
            }
        };
    }

    // The fileupload widget listens for change events on file input fields defined
    // via fileInput setting and paste or drop events of the given dropZone.
    // In addition to the default jQuery Widget methods, the fileupload widget
    // exposes the "add" and "send" methods, to add or directly send files using
    // the fileupload API.
    // By default, files added via file input selection, paste, drag & drop or
    // "add" method are uploaded immediately, but it is possible to override
    // the "add" callback option to queue file uploads.
    $.widget('blueimp.fileupload', {

        options: {
            // The drop target element(s), by the default the complete document.
            // Set to null to disable drag & drop support:
            dropZone: $(document),
            // The paste target element(s), by the default undefined.
            // Set to a DOM node or jQuery object to enable file pasting:
            pasteZone: undefined,
            // The file input field(s), that are listened to for change events.
            // If undefined, it is set to the file input fields inside
            // of the widget element on plugin initialization.
            // Set to null to disable the change listener.
            fileInput: undefined,
            // By default, the file input field is replaced with a clone after
            // each input field change event. This is required for iframe transport
            // queues and allows change events to be fired for the same file
            // selection, but can be disabled by setting the following option to false:
            replaceFileInput: true,
            // The parameter name for the file form data (the request argument name).
            // If undefined or empty, the name property of the file input field is
            // used, or "files[]" if the file input name property is also empty,
            // can be a string or an array of strings:
            paramName: undefined,
            // By default, each file of a selection is uploaded using an individual
            // request for XHR type uploads. Set to false to upload file
            // selections in one request each:
            singleFileUploads: true,
            // To limit the number of files uploaded with one XHR request,
            // set the following option to an integer greater than 0:
            limitMultiFileUploads: undefined,
            // The following option limits the number of files uploaded with one
            // XHR request to keep the request size under or equal to the defined
            // limit in bytes:
            limitMultiFileUploadSize: undefined,
            // Multipart file uploads add a number of bytes to each uploaded file,
            // therefore the following option adds an overhead for each file used
            // in the limitMultiFileUploadSize configuration:
            limitMultiFileUploadSizeOverhead: 512,
            // Set the following option to true to issue all file upload requests
            // in a sequential order:
            sequentialUploads: false,
            // To limit the number of concurrent uploads,
            // set the following option to an integer greater than 0:
            limitConcurrentUploads: undefined,
            // Set the following option to true to force iframe transport uploads:
            forceIframeTransport: false,
            // Set the following option to the location of a redirect url on the
            // origin server, for cross-domain iframe transport uploads:
            redirect: undefined,
            // The parameter name for the redirect url, sent as part of the form
            // data and set to 'redirect' if this option is empty:
            redirectParamName: undefined,
            // Set the following option to the location of a postMessage window,
            // to enable postMessage transport uploads:
            postMessage: undefined,
            // By default, XHR file uploads are sent as multipart/form-data.
            // The iframe transport is always using multipart/form-data.
            // Set to false to enable non-multipart XHR uploads:
            multipart: true,
            // To upload large files in smaller chunks, set the following option
            // to a preferred maximum chunk size. If set to 0, null or undefined,
            // or the browser does not support the required Blob API, files will
            // be uploaded as a whole.
            maxChunkSize: undefined,
            // When a non-multipart upload or a chunked multipart upload has been
            // aborted, this option can be used to resume the upload by setting
            // it to the size of the already uploaded bytes. This option is most
            // useful when modifying the options object inside of the "add" or
            // "send" callbacks, as the options are cloned for each file upload.
            uploadedBytes: undefined,
            // By default, failed (abort or error) file uploads are removed from the
            // global progress calculation. Set the following option to false to
            // prevent recalculating the global progress data:
            recalculateProgress: true,
            // Interval in milliseconds to calculate and trigger progress events:
            progressInterval: 100,
            // Interval in milliseconds to calculate progress bitrate:
            bitrateInterval: 500,
            // By default, uploads are started automatically when adding files:
            autoUpload: true,

            // Error and info messages:
            messages: {
                uploadedBytes: 'Uploaded bytes exceed file size'
            },

            // Translation function, gets the message key to be translated
            // and an object with context specific data as arguments:
            i18n: function (message, context) {
                message = this.messages[message] || message.toString();
                if (context) {
                    $.each(context, function (key, value) {
                        message = message.replace('{' + key + '}', value);
                    });
                }
                return message;
            },

            // Additional form data to be sent along with the file uploads can be set
            // using this option, which accepts an array of objects with name and
            // value properties, a function returning such an array, a FormData
            // object (for XHR file uploads), or a simple object.
            // The form of the first fileInput is given as parameter to the function:
            formData: function (form) {
                return form.serializeArray();
            },

            // The add callback is invoked as soon as files are added to the fileupload
            // widget (via file input selection, drag & drop, paste or add API call).
            // If the singleFileUploads option is enabled, this callback will be
            // called once for each file in the selection for XHR file uploads, else
            // once for each file selection.
            //
            // The upload starts when the submit method is invoked on the data parameter.
            // The data object contains a files property holding the added files
            // and allows you to override plugin options as well as define ajax settings.
            //
            // Listeners for this callback can also be bound the following way:
            // .bind('fileuploadadd', func);
            //
            // data.submit() returns a Promise object and allows to attach additional
            // handlers using jQuery's Deferred callbacks:
            // data.submit().done(func).fail(func).always(func);
            add: function (e, data) {
                if (e.isDefaultPrevented()) {
                    return false;
                }
                if (data.autoUpload || (data.autoUpload !== false &&
                        $(this).fileupload('option', 'autoUpload'))) {
                    data.process().done(function () {
                        data.submit();
                    });
                }
            },

            // Other callbacks:

            // Callback for the submit event of each file upload:
            // submit: function (e, data) {}, // .bind('fileuploadsubmit', func);

            // Callback for the start of each file upload request:
            // send: function (e, data) {}, // .bind('fileuploadsend', func);

            // Callback for successful uploads:
            // done: function (e, data) {}, // .bind('fileuploaddone', func);

            // Callback for failed (abort or error) uploads:
            // fail: function (e, data) {}, // .bind('fileuploadfail', func);

            // Callback for completed (success, abort or error) requests:
            // always: function (e, data) {}, // .bind('fileuploadalways', func);

            // Callback for upload progress events:
            // progress: function (e, data) {}, // .bind('fileuploadprogress', func);

            // Callback for global upload progress events:
            // progressall: function (e, data) {}, // .bind('fileuploadprogressall', func);

            // Callback for uploads start, equivalent to the global ajaxStart event:
            // start: function (e) {}, // .bind('fileuploadstart', func);

            // Callback for uploads stop, equivalent to the global ajaxStop event:
            // stop: function (e) {}, // .bind('fileuploadstop', func);

            // Callback for change events of the fileInput(s):
            // change: function (e, data) {}, // .bind('fileuploadchange', func);

            // Callback for paste events to the pasteZone(s):
            // paste: function (e, data) {}, // .bind('fileuploadpaste', func);

            // Callback for drop events of the dropZone(s):
            // drop: function (e, data) {}, // .bind('fileuploaddrop', func);

            // Callback for dragover events of the dropZone(s):
            // dragover: function (e) {}, // .bind('fileuploaddragover', func);

            // Callback for the start of each chunk upload request:
            // chunksend: function (e, data) {}, // .bind('fileuploadchunksend', func);

            // Callback for successful chunk uploads:
            // chunkdone: function (e, data) {}, // .bind('fileuploadchunkdone', func);

            // Callback for failed (abort or error) chunk uploads:
            // chunkfail: function (e, data) {}, // .bind('fileuploadchunkfail', func);

            // Callback for completed (success, abort or error) chunk upload requests:
            // chunkalways: function (e, data) {}, // .bind('fileuploadchunkalways', func);

            // The plugin options are used as settings object for the ajax calls.
            // The following are jQuery ajax settings required for the file uploads:
            processData: false,
            contentType: false,
            cache: false,
            timeout: 0
        },

        // A list of options that require reinitializing event listeners and/or
        // special initialization code:
        _specialOptions: [
            'fileInput',
            'dropZone',
            'pasteZone',
            'multipart',
            'forceIframeTransport'
        ],

        _blobSlice: $.support.blobSlice && function () {
            var slice = this.slice || this.webkitSlice || this.mozSlice;
            return slice.apply(this, arguments);
        },

        _BitrateTimer: function () {
            this.timestamp = ((Date.now) ? Date.now() : (new Date()).getTime());
            this.loaded = 0;
            this.bitrate = 0;
            this.getBitrate = function (now, loaded, interval) {
                var timeDiff = now - this.timestamp;
                if (!this.bitrate || !interval || timeDiff > interval) {
                    this.bitrate = (loaded - this.loaded) * (1000 / timeDiff) * 8;
                    this.loaded = loaded;
                    this.timestamp = now;
                }
                return this.bitrate;
            };
        },

        _isXHRUpload: function (options) {
            return !options.forceIframeTransport &&
                ((!options.multipart && $.support.xhrFileUpload) ||
                $.support.xhrFormDataFileUpload);
        },

        _getFormData: function (options) {
            var formData;
            if ($.type(options.formData) === 'function') {
                return options.formData(options.form);
            }
            if ($.isArray(options.formData)) {
                return options.formData;
            }
            if ($.type(options.formData) === 'object') {
                formData = [];
                $.each(options.formData, function (name, value) {
                    formData.push({name: name, value: value});
                });
                return formData;
            }
            return [];
        },

        _getTotal: function (files) {
            var total = 0;
            $.each(files, function (index, file) {
                total += file.size || 1;
            });
            return total;
        },

        _initProgressObject: function (obj) {
            var progress = {
                loaded: 0,
                total: 0,
                bitrate: 0
            };
            if (obj._progress) {
                $.extend(obj._progress, progress);
            } else {
                obj._progress = progress;
            }
        },

        _initResponseObject: function (obj) {
            var prop;
            if (obj._response) {
                for (prop in obj._response) {
                    if (obj._response.hasOwnProperty(prop)) {
                        delete obj._response[prop];
                    }
                }
            } else {
                obj._response = {};
            }
        },

        _onProgress: function (e, data) {
            if (e.lengthComputable) {
                var now = ((Date.now) ? Date.now() : (new Date()).getTime()),
                    loaded;
                if (data._time && data.progressInterval &&
                        (now - data._time < data.progressInterval) &&
                        e.loaded !== e.total) {
                    return;
                }
                data._time = now;
                loaded = Math.floor(
                    e.loaded / e.total * (data.chunkSize || data._progress.total)
                ) + (data.uploadedBytes || 0);
                // Add the difference from the previously loaded state
                // to the global loaded counter:
                this._progress.loaded += (loaded - data._progress.loaded);
                this._progress.bitrate = this._bitrateTimer.getBitrate(
                    now,
                    this._progress.loaded,
                    data.bitrateInterval
                );
                data._progress.loaded = data.loaded = loaded;
                data._progress.bitrate = data.bitrate = data._bitrateTimer.getBitrate(
                    now,
                    loaded,
                    data.bitrateInterval
                );
                // Trigger a custom progress event with a total data property set
                // to the file size(s) of the current upload and a loaded data
                // property calculated accordingly:
                this._trigger(
                    'progress',
                    $.Event('progress', {delegatedEvent: e}),
                    data
                );
                // Trigger a global progress event for all current file uploads,
                // including ajax calls queued for sequential file uploads:
                this._trigger(
                    'progressall',
                    $.Event('progressall', {delegatedEvent: e}),
                    this._progress
                );
            }
        },

        _initProgressListener: function (options) {
            var that = this,
                xhr = options.xhr ? options.xhr() : $.ajaxSettings.xhr();
            // Accesss to the native XHR object is required to add event listeners
            // for the upload progress event:
            if (xhr.upload) {
                $(xhr.upload).bind('progress', function (e) {
                    var oe = e.originalEvent;
                    // Make sure the progress event properties get copied over:
                    e.lengthComputable = oe.lengthComputable;
                    e.loaded = oe.loaded;
                    e.total = oe.total;
                    that._onProgress(e, options);
                });
                options.xhr = function () {
                    return xhr;
                };
            }
        },

        _isInstanceOf: function (type, obj) {
            // Cross-frame instanceof check
            return Object.prototype.toString.call(obj) === '[object ' + type + ']';
        },

        _initXHRData: function (options) {
            var that = this,
                formData,
                file = options.files[0],
                // Ignore non-multipart setting if not supported:
                multipart = options.multipart || !$.support.xhrFileUpload,
                paramName = $.type(options.paramName) === 'array' ?
                    options.paramName[0] : options.paramName;
            options.headers = $.extend({}, options.headers);
            if (options.contentRange) {
                options.headers['Content-Range'] = options.contentRange;
            }
            if (!multipart || options.blob || !this._isInstanceOf('File', file)) {
                options.headers['Content-Disposition'] = 'attachment; filename="' +
                    encodeURI(file.name) + '"';
            }
            if (!multipart) {
                options.contentType = file.type || 'application/octet-stream';
                options.data = options.blob || file;
            } else if ($.support.xhrFormDataFileUpload) {
                if (options.postMessage) {
                    // window.postMessage does not allow sending FormData
                    // objects, so we just add the File/Blob objects to
                    // the formData array and let the postMessage window
                    // create the FormData object out of this array:
                    formData = this._getFormData(options);
                    if (options.blob) {
                        formData.push({
                            name: paramName,
                            value: options.blob
                        });
                    } else {
                        $.each(options.files, function (index, file) {
                            formData.push({
                                name: ($.type(options.paramName) === 'array' &&
                                    options.paramName[index]) || paramName,
                                value: file
                            });
                        });
                    }
                } else {
                    if (that._isInstanceOf('FormData', options.formData)) {
                        formData = options.formData;
                    } else {
                        formData = new FormData();
                        $.each(this._getFormData(options), function (index, field) {
                            formData.append(field.name, field.value);
                        });
                    }
                    if (options.blob) {
                        formData.append(paramName, options.blob, file.name);
                    } else {
                        $.each(options.files, function (index, file) {
                            // This check allows the tests to run with
                            // dummy objects:
                            if (that._isInstanceOf('File', file) ||
                                    that._isInstanceOf('Blob', file)) {
                                formData.append(
                                    ($.type(options.paramName) === 'array' &&
                                        options.paramName[index]) || paramName,
                                    file,
                                    file.uploadName || file.name
                                );
                            }
                        });
                    }
                }
                options.data = formData;
            }
            // Blob reference is not needed anymore, free memory:
            options.blob = null;
        },

        _initIframeSettings: function (options) {
            var targetHost = $('<a></a>').prop('href', options.url).prop('host');
            // Setting the dataType to iframe enables the iframe transport:
            options.dataType = 'iframe ' + (options.dataType || '');
            // The iframe transport accepts a serialized array as form data:
            options.formData = this._getFormData(options);
            // Add redirect url to form data on cross-domain uploads:
            if (options.redirect && targetHost && targetHost !== location.host) {
                options.formData.push({
                    name: options.redirectParamName || 'redirect',
                    value: options.redirect
                });
            }
        },

        _initDataSettings: function (options) {
            if (this._isXHRUpload(options)) {
                if (!this._chunkedUpload(options, true)) {
                    if (!options.data) {
                        this._initXHRData(options);
                    }
                    this._initProgressListener(options);
                }
                if (options.postMessage) {
                    // Setting the dataType to postmessage enables the
                    // postMessage transport:
                    options.dataType = 'postmessage ' + (options.dataType || '');
                }
            } else {
                this._initIframeSettings(options);
            }
        },

        _getParamName: function (options) {
            var fileInput = $(options.fileInput),
                paramName = options.paramName;
            if (!paramName) {
                paramName = [];
                fileInput.each(function () {
                    var input = $(this),
                        name = input.prop('name') || 'files[]',
                        i = (input.prop('files') || [1]).length;
                    while (i) {
                        paramName.push(name);
                        i -= 1;
                    }
                });
                if (!paramName.length) {
                    paramName = [fileInput.prop('name') || 'files[]'];
                }
            } else if (!$.isArray(paramName)) {
                paramName = [paramName];
            }
            return paramName;
        },

        _initFormSettings: function (options) {
            // Retrieve missing options from the input field and the
            // associated form, if available:
            if (!options.form || !options.form.length) {
                options.form = $(options.fileInput.prop('form'));
                // If the given file input doesn't have an associated form,
                // use the default widget file input's form:
                if (!options.form.length) {
                    options.form = $(this.options.fileInput.prop('form'));
                }
            }
            options.paramName = this._getParamName(options);
            if (!options.url) {
                options.url = options.form.prop('action') || location.href;
            }
            // The HTTP request method must be "POST" or "PUT":
            options.type = (options.type ||
                ($.type(options.form.prop('method')) === 'string' &&
                    options.form.prop('method')) || ''
                ).toUpperCase();
            if (options.type !== 'POST' && options.type !== 'PUT' &&
                    options.type !== 'PATCH') {
                options.type = 'POST';
            }
            if (!options.formAcceptCharset) {
                options.formAcceptCharset = options.form.attr('accept-charset');
            }
        },

        _getAJAXSettings: function (data) {
            var options = $.extend({}, this.options, data);
            this._initFormSettings(options);
            this._initDataSettings(options);
            return options;
        },

        // jQuery 1.6 doesn't provide .state(),
        // while jQuery 1.8+ removed .isRejected() and .isResolved():
        _getDeferredState: function (deferred) {
            if (deferred.state) {
                return deferred.state();
            }
            if (deferred.isResolved()) {
                return 'resolved';
            }
            if (deferred.isRejected()) {
                return 'rejected';
            }
            return 'pending';
        },

        // Maps jqXHR callbacks to the equivalent
        // methods of the given Promise object:
        _enhancePromise: function (promise) {
            promise.success = promise.done;
            promise.error = promise.fail;
            promise.complete = promise.always;
            return promise;
        },

        // Creates and returns a Promise object enhanced with
        // the jqXHR methods abort, success, error and complete:
        _getXHRPromise: function (resolveOrReject, context, args) {
            var dfd = $.Deferred(),
                promise = dfd.promise();
            context = context || this.options.context || promise;
            if (resolveOrReject === true) {
                dfd.resolveWith(context, args);
            } else if (resolveOrReject === false) {
                dfd.rejectWith(context, args);
            }
            promise.abort = dfd.promise;
            return this._enhancePromise(promise);
        },

        // Adds convenience methods to the data callback argument:
        _addConvenienceMethods: function (e, data) {
            var that = this,
                getPromise = function (args) {
                    return $.Deferred().resolveWith(that, args).promise();
                };
            data.process = function (resolveFunc, rejectFunc) {
                if (resolveFunc || rejectFunc) {
                    data._processQueue = this._processQueue =
                        (this._processQueue || getPromise([this])).then(
                            function () {
                                if (data.errorThrown) {
                                    return $.Deferred()
                                        .rejectWith(that, [data]).promise();
                                }
                                return getPromise(arguments);
                            }
                        ).then(resolveFunc, rejectFunc);
                }
                return this._processQueue || getPromise([this]);
            };
            data.submit = function () {
                if (this.state() !== 'pending') {
                    data.jqXHR = this.jqXHR =
                        (that._trigger(
                            'submit',
                            $.Event('submit', {delegatedEvent: e}),
                            this
                        ) !== false) && that._onSend(e, this);
                }
                return this.jqXHR || that._getXHRPromise();
            };
            data.abort = function () {
                if (this.jqXHR) {
                    return this.jqXHR.abort();
                }
                this.errorThrown = 'abort';
                that._trigger('fail', null, this);
                return that._getXHRPromise(false);
            };
            data.state = function () {
                if (this.jqXHR) {
                    return that._getDeferredState(this.jqXHR);
                }
                if (this._processQueue) {
                    return that._getDeferredState(this._processQueue);
                }
            };
            data.processing = function () {
                return !this.jqXHR && this._processQueue && that
                    ._getDeferredState(this._processQueue) === 'pending';
            };
            data.progress = function () {
                return this._progress;
            };
            data.response = function () {
                return this._response;
            };
        },

        // Parses the Range header from the server response
        // and returns the uploaded bytes:
        _getUploadedBytes: function (jqXHR) {
            var range = jqXHR.getResponseHeader('Range'),
                parts = range && range.split('-'),
                upperBytesPos = parts && parts.length > 1 &&
                    parseInt(parts[1], 10);
            return upperBytesPos && upperBytesPos + 1;
        },

        // Uploads a file in multiple, sequential requests
        // by splitting the file up in multiple blob chunks.
        // If the second parameter is true, only tests if the file
        // should be uploaded in chunks, but does not invoke any
        // upload requests:
        _chunkedUpload: function (options, testOnly) {
            options.uploadedBytes = options.uploadedBytes || 0;
            var that = this,
                file = options.files[0],
                fs = file.size,
                ub = options.uploadedBytes,
                mcs = options.maxChunkSize || fs,
                slice = this._blobSlice,
                dfd = $.Deferred(),
                promise = dfd.promise(),
                jqXHR,
                upload;
            if (!(this._isXHRUpload(options) && slice && (ub || mcs < fs)) ||
                    options.data) {
                return false;
            }
            if (testOnly) {
                return true;
            }
            if (ub >= fs) {
                file.error = options.i18n('uploadedBytes');
                return this._getXHRPromise(
                    false,
                    options.context,
                    [null, 'error', file.error]
                );
            }
            // The chunk upload method:
            upload = function () {
                // Clone the options object for each chunk upload:
                var o = $.extend({}, options),
                    currentLoaded = o._progress.loaded;
                o.blob = slice.call(
                    file,
                    ub,
                    ub + mcs,
                    file.type
                );
                // Store the current chunk size, as the blob itself
                // will be dereferenced after data processing:
                o.chunkSize = o.blob.size;
                // Expose the chunk bytes position range:
                o.contentRange = 'bytes ' + ub + '-' +
                    (ub + o.chunkSize - 1) + '/' + fs;
                // Process the upload data (the blob and potential form data):
                that._initXHRData(o);
                // Add progress listeners for this chunk upload:
                that._initProgressListener(o);
                jqXHR = ((that._trigger('chunksend', null, o) !== false && $.ajax(o)) ||
                        that._getXHRPromise(false, o.context))
                    .done(function (result, textStatus, jqXHR) {
                        ub = that._getUploadedBytes(jqXHR) ||
                            (ub + o.chunkSize);
                        // Create a progress event if no final progress event
                        // with loaded equaling total has been triggered
                        // for this chunk:
                        if (currentLoaded + o.chunkSize - o._progress.loaded) {
                            that._onProgress($.Event('progress', {
                                lengthComputable: true,
                                loaded: ub - o.uploadedBytes,
                                total: ub - o.uploadedBytes
                            }), o);
                        }
                        options.uploadedBytes = o.uploadedBytes = ub;
                        o.result = result;
                        o.textStatus = textStatus;
                        o.jqXHR = jqXHR;
                        that._trigger('chunkdone', null, o);
                        that._trigger('chunkalways', null, o);
                        if (ub < fs) {
                            // File upload not yet complete,
                            // continue with the next chunk:
                            upload();
                        } else {
                            dfd.resolveWith(
                                o.context,
                                [result, textStatus, jqXHR]
                            );
                        }
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        o.jqXHR = jqXHR;
                        o.textStatus = textStatus;
                        o.errorThrown = errorThrown;
                        that._trigger('chunkfail', null, o);
                        that._trigger('chunkalways', null, o);
                        dfd.rejectWith(
                            o.context,
                            [jqXHR, textStatus, errorThrown]
                        );
                    });
            };
            this._enhancePromise(promise);
            promise.abort = function () {
                return jqXHR.abort();
            };
            upload();
            return promise;
        },

        _beforeSend: function (e, data) {
            if (this._active === 0) {
                // the start callback is triggered when an upload starts
                // and no other uploads are currently running,
                // equivalent to the global ajaxStart event:
                this._trigger('start');
                // Set timer for global bitrate progress calculation:
                this._bitrateTimer = new this._BitrateTimer();
                // Reset the global progress values:
                this._progress.loaded = this._progress.total = 0;
                this._progress.bitrate = 0;
            }
            // Make sure the container objects for the .response() and
            // .progress() methods on the data object are available
            // and reset to their initial state:
            this._initResponseObject(data);
            this._initProgressObject(data);
            data._progress.loaded = data.loaded = data.uploadedBytes || 0;
            data._progress.total = data.total = this._getTotal(data.files) || 1;
            data._progress.bitrate = data.bitrate = 0;
            this._active += 1;
            // Initialize the global progress values:
            this._progress.loaded += data.loaded;
            this._progress.total += data.total;
        },

        _onDone: function (result, textStatus, jqXHR, options) {
            var total = options._progress.total,
                response = options._response;
            if (options._progress.loaded < total) {
                // Create a progress event if no final progress event
                // with loaded equaling total has been triggered:
                this._onProgress($.Event('progress', {
                    lengthComputable: true,
                    loaded: total,
                    total: total
                }), options);
            }
            response.result = options.result = result;
            response.textStatus = options.textStatus = textStatus;
            response.jqXHR = options.jqXHR = jqXHR;
            this._trigger('done', null, options);
        },

        _onFail: function (jqXHR, textStatus, errorThrown, options) {
            var response = options._response;
            if (options.recalculateProgress) {
                // Remove the failed (error or abort) file upload from
                // the global progress calculation:
                this._progress.loaded -= options._progress.loaded;
                this._progress.total -= options._progress.total;
            }
            response.jqXHR = options.jqXHR = jqXHR;
            response.textStatus = options.textStatus = textStatus;
            response.errorThrown = options.errorThrown = errorThrown;
            this._trigger('fail', null, options);
        },

        _onAlways: function (jqXHRorResult, textStatus, jqXHRorError, options) {
            // jqXHRorResult, textStatus and jqXHRorError are added to the
            // options object via done and fail callbacks
            this._trigger('always', null, options);
        },

        _onSend: function (e, data) {
            if (!data.submit) {
                this._addConvenienceMethods(e, data);
            }
            var that = this,
                jqXHR,
                aborted,
                slot,
                pipe,
                options = that._getAJAXSettings(data),
                send = function () {
                    that._sending += 1;
                    // Set timer for bitrate progress calculation:
                    options._bitrateTimer = new that._BitrateTimer();
                    jqXHR = jqXHR || (
                        ((aborted || that._trigger(
                            'send',
                            $.Event('send', {delegatedEvent: e}),
                            options
                        ) === false) &&
                        that._getXHRPromise(false, options.context, aborted)) ||
                        that._chunkedUpload(options) || $.ajax(options)
                    ).done(function (result, textStatus, jqXHR) {
                        that._onDone(result, textStatus, jqXHR, options);
                    }).fail(function (jqXHR, textStatus, errorThrown) {
                        that._onFail(jqXHR, textStatus, errorThrown, options);
                    }).always(function (jqXHRorResult, textStatus, jqXHRorError) {
                        that._onAlways(
                            jqXHRorResult,
                            textStatus,
                            jqXHRorError,
                            options
                        );
                        that._sending -= 1;
                        that._active -= 1;
                        if (options.limitConcurrentUploads &&
                                options.limitConcurrentUploads > that._sending) {
                            // Start the next queued upload,
                            // that has not been aborted:
                            var nextSlot = that._slots.shift();
                            while (nextSlot) {
                                if (that._getDeferredState(nextSlot) === 'pending') {
                                    nextSlot.resolve();
                                    break;
                                }
                                nextSlot = that._slots.shift();
                            }
                        }
                        if (that._active === 0) {
                            // The stop callback is triggered when all uploads have
                            // been completed, equivalent to the global ajaxStop event:
                            that._trigger('stop');
                        }
                    });
                    return jqXHR;
                };
            this._beforeSend(e, options);
            if (this.options.sequentialUploads ||
                    (this.options.limitConcurrentUploads &&
                    this.options.limitConcurrentUploads <= this._sending)) {
                if (this.options.limitConcurrentUploads > 1) {
                    slot = $.Deferred();
                    this._slots.push(slot);
                    pipe = slot.then(send);
                } else {
                    this._sequence = this._sequence.then(send, send);
                    pipe = this._sequence;
                }
                // Return the piped Promise object, enhanced with an abort method,
                // which is delegated to the jqXHR object of the current upload,
                // and jqXHR callbacks mapped to the equivalent Promise methods:
                pipe.abort = function () {
                    aborted = [undefined, 'abort', 'abort'];
                    if (!jqXHR) {
                        if (slot) {
                            slot.rejectWith(options.context, aborted);
                        }
                        return send();
                    }
                    return jqXHR.abort();
                };
                return this._enhancePromise(pipe);
            }
            return send();
        },

        _onAdd: function (e, data) {
            var that = this,
                result = true,
                options = $.extend({}, this.options, data),
                files = data.files,
                filesLength = files.length,
                limit = options.limitMultiFileUploads,
                limitSize = options.limitMultiFileUploadSize,
                overhead = options.limitMultiFileUploadSizeOverhead,
                batchSize = 0,
                paramName = this._getParamName(options),
                paramNameSet,
                paramNameSlice,
                fileSet,
                i,
                j = 0;
            if (!filesLength) {
                return false;
            }
            if (limitSize && files[0].size === undefined) {
                limitSize = undefined;
            }
            if (!(options.singleFileUploads || limit || limitSize) ||
                    !this._isXHRUpload(options)) {
                fileSet = [files];
                paramNameSet = [paramName];
            } else if (!(options.singleFileUploads || limitSize) && limit) {
                fileSet = [];
                paramNameSet = [];
                for (i = 0; i < filesLength; i += limit) {
                    fileSet.push(files.slice(i, i + limit));
                    paramNameSlice = paramName.slice(i, i + limit);
                    if (!paramNameSlice.length) {
                        paramNameSlice = paramName;
                    }
                    paramNameSet.push(paramNameSlice);
                }
            } else if (!options.singleFileUploads && limitSize) {
                fileSet = [];
                paramNameSet = [];
                for (i = 0; i < filesLength; i = i + 1) {
                    batchSize += files[i].size + overhead;
                    if (i + 1 === filesLength ||
                            ((batchSize + files[i + 1].size + overhead) > limitSize) ||
                            (limit && i + 1 - j >= limit)) {
                        fileSet.push(files.slice(j, i + 1));
                        paramNameSlice = paramName.slice(j, i + 1);
                        if (!paramNameSlice.length) {
                            paramNameSlice = paramName;
                        }
                        paramNameSet.push(paramNameSlice);
                        j = i + 1;
                        batchSize = 0;
                    }
                }
            } else {
                paramNameSet = paramName;
            }
            data.originalFiles = files;
            $.each(fileSet || files, function (index, element) {
                var newData = $.extend({}, data);
                newData.files = fileSet ? element : [element];
                newData.paramName = paramNameSet[index];
                that._initResponseObject(newData);
                that._initProgressObject(newData);
                that._addConvenienceMethods(e, newData);
                result = that._trigger(
                    'add',
                    $.Event('add', {delegatedEvent: e}),
                    newData
                );
                return result;
            });
            return result;
        },

        _replaceFileInput: function (data) {
            var input = data.fileInput,
                inputClone = input.clone(true),
                restoreFocus = input.is(document.activeElement);
            // Add a reference for the new cloned file input to the data argument:
            data.fileInputClone = inputClone;
            $('<form></form>').append(inputClone)[0].reset();
            // Detaching allows to insert the fileInput on another form
            // without loosing the file input value:
            input.after(inputClone).detach();
            // If the fileInput had focus before it was detached,
            // restore focus to the inputClone.
            if (restoreFocus) {
                inputClone.focus();
            }
            // Avoid memory leaks with the detached file input:
            $.cleanData(input.unbind('remove'));
            // Replace the original file input element in the fileInput
            // elements set with the clone, which has been copied including
            // event handlers:
            this.options.fileInput = this.options.fileInput.map(function (i, el) {
                if (el === input[0]) {
                    return inputClone[0];
                }
                return el;
            });
            // If the widget has been initialized on the file input itself,
            // override this.element with the file input clone:
            if (input[0] === this.element[0]) {
                this.element = inputClone;
            }
        },

        _handleFileTreeEntry: function (entry, path) {
            var that = this,
                dfd = $.Deferred(),
                errorHandler = function (e) {
                    if (e && !e.entry) {
                        e.entry = entry;
                    }
                    // Since $.when returns immediately if one
                    // Deferred is rejected, we use resolve instead.
                    // This allows valid files and invalid items
                    // to be returned together in one set:
                    dfd.resolve([e]);
                },
                successHandler = function (entries) {
                    that._handleFileTreeEntries(
                        entries,
                        path + entry.name + '/'
                    ).done(function (files) {
                        dfd.resolve(files);
                    }).fail(errorHandler);
                },
                readEntries = function () {
                    dirReader.readEntries(function (results) {
                        if (!results.length) {
                            successHandler(entries);
                        } else {
                            entries = entries.concat(results);
                            readEntries();
                        }
                    }, errorHandler);
                },
                dirReader, entries = [];
            path = path || '';
            if (entry.isFile) {
                if (entry._file) {
                    // Workaround for Chrome bug #149735
                    entry._file.relativePath = path;
                    dfd.resolve(entry._file);
                } else {
                    entry.file(function (file) {
                        file.relativePath = path;
                        dfd.resolve(file);
                    }, errorHandler);
                }
            } else if (entry.isDirectory) {
                dirReader = entry.createReader();
                readEntries();
            } else {
                // Return an empy list for file system items
                // other than files or directories:
                dfd.resolve([]);
            }
            return dfd.promise();
        },

        _handleFileTreeEntries: function (entries, path) {
            var that = this;
            return $.when.apply(
                $,
                $.map(entries, function (entry) {
                    return that._handleFileTreeEntry(entry, path);
                })
            ).then(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _getDroppedFiles: function (dataTransfer) {
            dataTransfer = dataTransfer || {};
            var items = dataTransfer.items;
            if (items && items.length && (items[0].webkitGetAsEntry ||
                    items[0].getAsEntry)) {
                return this._handleFileTreeEntries(
                    $.map(items, function (item) {
                        var entry;
                        if (item.webkitGetAsEntry) {
                            entry = item.webkitGetAsEntry();
                            if (entry) {
                                // Workaround for Chrome bug #149735:
                                entry._file = item.getAsFile();
                            }
                            return entry;
                        }
                        return item.getAsEntry();
                    })
                );
            }
            return $.Deferred().resolve(
                $.makeArray(dataTransfer.files)
            ).promise();
        },

        _getSingleFileInputFiles: function (fileInput) {
            fileInput = $(fileInput);
            var entries = fileInput.prop('webkitEntries') ||
                    fileInput.prop('entries'),
                files,
                value;
            if (entries && entries.length) {
                return this._handleFileTreeEntries(entries);
            }
            files = $.makeArray(fileInput.prop('files'));
            if (!files.length) {
                value = fileInput.prop('value');
                if (!value) {
                    return $.Deferred().resolve([]).promise();
                }
                // If the files property is not available, the browser does not
                // support the File API and we add a pseudo File object with
                // the input value as name with path information removed:
                files = [{name: value.replace(/^.*\\/, '')}];
            } else if (files[0].name === undefined && files[0].fileName) {
                // File normalization for Safari 4 and Firefox 3:
                $.each(files, function (index, file) {
                    file.name = file.fileName;
                    file.size = file.fileSize;
                });
            }
            return $.Deferred().resolve(files).promise();
        },

        _getFileInputFiles: function (fileInput) {
            if (!(fileInput instanceof $) || fileInput.length === 1) {
                return this._getSingleFileInputFiles(fileInput);
            }
            return $.when.apply(
                $,
                $.map(fileInput, this._getSingleFileInputFiles)
            ).then(function () {
                return Array.prototype.concat.apply(
                    [],
                    arguments
                );
            });
        },

        _onChange: function (e) {
            var that = this,
                data = {
                    fileInput: $(e.target),
                    form: $(e.target.form)
                };
            this._getFileInputFiles(data.fileInput).always(function (files) {
                data.files = files;
                if (that.options.replaceFileInput) {
                    that._replaceFileInput(data);
                }
                if (that._trigger(
                        'change',
                        $.Event('change', {delegatedEvent: e}),
                        data
                    ) !== false) {
                    that._onAdd(e, data);
                }
            });
        },

        _onPaste: function (e) {
            var items = e.originalEvent && e.originalEvent.clipboardData &&
                    e.originalEvent.clipboardData.items,
                data = {files: []};
            if (items && items.length) {
                $.each(items, function (index, item) {
                    var file = item.getAsFile && item.getAsFile();
                    if (file) {
                        data.files.push(file);
                    }
                });
                if (this._trigger(
                        'paste',
                        $.Event('paste', {delegatedEvent: e}),
                        data
                    ) !== false) {
                    this._onAdd(e, data);
                }
            }
        },

        _onDrop: function (e) {
            e.dataTransfer = e.originalEvent && e.originalEvent.dataTransfer;
            var that = this,
                dataTransfer = e.dataTransfer,
                data = {};
            if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
                e.preventDefault();
                this._getDroppedFiles(dataTransfer).always(function (files) {
                    data.files = files;
                    if (that._trigger(
                            'drop',
                            $.Event('drop', {delegatedEvent: e}),
                            data
                        ) !== false) {
                        that._onAdd(e, data);
                    }
                });
            }
        },

        _onDragOver: getDragHandler('dragover'),

        _onDragEnter: getDragHandler('dragenter'),

        _onDragLeave: getDragHandler('dragleave'),

        _initEventHandlers: function () {
            if (this._isXHRUpload(this.options)) {
                this._on(this.options.dropZone, {
                    dragover: this._onDragOver,
                    drop: this._onDrop,
                    // event.preventDefault() on dragenter is required for IE10+:
                    dragenter: this._onDragEnter,
                    // dragleave is not required, but added for completeness:
                    dragleave: this._onDragLeave
                });
                this._on(this.options.pasteZone, {
                    paste: this._onPaste
                });
            }
            if ($.support.fileInput) {
                this._on(this.options.fileInput, {
                    change: this._onChange
                });
            }
        },

        _destroyEventHandlers: function () {
            this._off(this.options.dropZone, 'dragenter dragleave dragover drop');
            this._off(this.options.pasteZone, 'paste');
            this._off(this.options.fileInput, 'change');
        },

        _setOption: function (key, value) {
            var reinit = $.inArray(key, this._specialOptions) !== -1;
            if (reinit) {
                this._destroyEventHandlers();
            }
            this._super(key, value);
            if (reinit) {
                this._initSpecialOptions();
                this._initEventHandlers();
            }
        },

        _initSpecialOptions: function () {
            var options = this.options;
            if (options.fileInput === undefined) {
                options.fileInput = this.element.is('input[type="file"]') ?
                        this.element : this.element.find('input[type="file"]');
            } else if (!(options.fileInput instanceof $)) {
                options.fileInput = $(options.fileInput);
            }
            if (!(options.dropZone instanceof $)) {
                options.dropZone = $(options.dropZone);
            }
            if (!(options.pasteZone instanceof $)) {
                options.pasteZone = $(options.pasteZone);
            }
        },

        _getRegExp: function (str) {
            var parts = str.split('/'),
                modifiers = parts.pop();
            parts.shift();
            return new RegExp(parts.join('/'), modifiers);
        },

        _isRegExpOption: function (key, value) {
            return key !== 'url' && $.type(value) === 'string' &&
                /^\/.*\/[igm]{0,3}$/.test(value);
        },

        _initDataAttributes: function () {
            var that = this,
                options = this.options,
                data = this.element.data();
            // Initialize options set via HTML5 data-attributes:
            $.each(
                this.element[0].attributes,
                function (index, attr) {
                    var key = attr.name.toLowerCase(),
                        value;
                    if (/^data-/.test(key)) {
                        // Convert hyphen-ated key to camelCase:
                        key = key.slice(5).replace(/-[a-z]/g, function (str) {
                            return str.charAt(1).toUpperCase();
                        });
                        value = data[key];
                        if (that._isRegExpOption(key, value)) {
                            value = that._getRegExp(value);
                        }
                        options[key] = value;
                    }
                }
            );
        },

        _create: function () {
            this._initDataAttributes();
            this._initSpecialOptions();
            this._slots = [];
            this._sequence = this._getXHRPromise(true);
            this._sending = this._active = 0;
            this._initProgressObject(this);
            this._initEventHandlers();
        },

        // This method is exposed to the widget API and allows to query
        // the number of active uploads:
        active: function () {
            return this._active;
        },

        // This method is exposed to the widget API and allows to query
        // the widget upload progress.
        // It returns an object with loaded, total and bitrate properties
        // for the running uploads:
        progress: function () {
            return this._progress;
        },

        // This method is exposed to the widget API and allows adding files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files property and can contain additional options:
        // .fileupload('add', {files: filesList});
        add: function (data) {
            var that = this;
            if (!data || this.options.disabled) {
                return;
            }
            if (data.fileInput && !data.files) {
                this._getFileInputFiles(data.fileInput).always(function (files) {
                    data.files = files;
                    that._onAdd(null, data);
                });
            } else {
                data.files = $.makeArray(data.files);
                this._onAdd(null, data);
            }
        },

        // This method is exposed to the widget API and allows sending files
        // using the fileupload API. The data parameter accepts an object which
        // must have a files or fileInput property and can contain additional options:
        // .fileupload('send', {files: filesList});
        // The method returns a Promise object for the file upload call.
        send: function (data) {
            if (data && !this.options.disabled) {
                if (data.fileInput && !data.files) {
                    var that = this,
                        dfd = $.Deferred(),
                        promise = dfd.promise(),
                        jqXHR,
                        aborted;
                    promise.abort = function () {
                        aborted = true;
                        if (jqXHR) {
                            return jqXHR.abort();
                        }
                        dfd.reject(null, 'abort', 'abort');
                        return promise;
                    };
                    this._getFileInputFiles(data.fileInput).always(
                        function (files) {
                            if (aborted) {
                                return;
                            }
                            if (!files.length) {
                                dfd.reject();
                                return;
                            }
                            data.files = files;
                            jqXHR = that._onSend(null, data);
                            jqXHR.then(
                                function (result, textStatus, jqXHR) {
                                    dfd.resolve(result, textStatus, jqXHR);
                                },
                                function (jqXHR, textStatus, errorThrown) {
                                    dfd.reject(jqXHR, textStatus, errorThrown);
                                }
                            );
                        }
                    );
                    return this._enhancePromise(promise);
                }
                data.files = $.makeArray(data.files);
                if (data.files.length) {
                    return this._onSend(null, data);
                }
            }
            return this._getXHRPromise(false, data && data.context);
        }

    });

}));

/*!
 * jquery-visibility v1.0.11
 * Page visibility shim for jQuery.
 *
 * Project Website: http://mths.be/visibility
 *
 * @version 1.0.11
 * @license MIT.
 * @author Mathias Bynens - @mathias
 * @author Jan Paepke - @janpaepke
 */
;(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD. Register as an anonymous module.
		define(['jquery'], function ($) {
			return factory(root, $);
		});
	} else if (typeof exports === 'object') {
		// Node/CommonJS
		module.exports = factory(root, require('jquery'));
	} else {
		// Browser globals
		factory(root, jQuery);
	}
}(this, function(window, $, undefined) {
	"use strict";

	var
		document = window.document,
		property, // property name of document, that stores page visibility
		vendorPrefixes = ['webkit', 'o', 'ms', 'moz', ''],
		$support = $.support || {},
	// In Opera, `'onfocusin' in document == true`, hence the extra `hasFocus` check to detect IE-like behavior
		eventName = 'onfocusin' in document && 'hasFocus' in document ?
			'focusin focusout' :
			'focus blur';

	var prefix;
	while ((prefix = vendorPrefixes.pop()) !== undefined) {
		property = (prefix ? prefix + 'H': 'h') + 'idden';
		$support.pageVisibility = document[property] !== undefined;
		if ($support.pageVisibility) {
			eventName = prefix + 'visibilitychange';
			break;
		}
	}

	// normalize to and update document hidden property
	function updateState() {
		if (property !== 'hidden') {
			document.hidden = $support.pageVisibility ? document[property] : undefined;
		}
	}
	updateState();

	$(/blur$/.test(eventName) ? window : document).on(eventName, function(event) {
		var type = event.type;
		var originalEvent = event.originalEvent;

		// Avoid errors from triggered native events for which `originalEvent` is
		// not available.
		if (!originalEvent) {
			return;
		}

		var toElement = originalEvent.toElement;

		// If it’s a `{focusin,focusout}` event (IE), `fromElement` and `toElement`
		// should both be `null` or `undefined`; else, the page visibility hasn’t
		// changed, but the user just clicked somewhere in the doc. In IE9, we need
		// to check the `relatedTarget` property instead.
		if (
			!/^focus./.test(type) || (
				toElement === undefined &&
				originalEvent.fromElement === undefined &&
				originalEvent.relatedTarget === undefined
			)
		) {
			$(document).triggerHandler(
				property && document[property] || /^(?:blur|focusout)$/.test(type) ?
					'hide' :
					'show'
			);
		}
		// and update the current state
		updateState();
	});
}));


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function(OC, OCA) {

	/**
	 * @class OC.Files.FileInfo
	 * @classdesc File information
	 *
	 * @param {Object} attributes file data
	 * @param {int} attributes.id file id
	 * @param {string} attributes.name file name
	 * @param {string} attributes.path path leading to the file,
	 * without the file name and with a leading slash
	 * @param {int} attributes.size size
	 * @param {string} attributes.mimetype mime type
	 * @param {string} attributes.icon icon URL
	 * @param {int} attributes.permissions permissions
	 * @param {Date} attributes.mtime modification time
	 * @param {string} attributes.etag etag
	 * @param {string} mountType mount type
	 *
	 * @since 8.2
	 */
	var FileInfoModel = OC.Backbone.Model.extend({

		defaults: {
			mimetype: 'application/octet-stream',
			path: ''
		},

		_filesClient: null,

		initialize: function(data, options) {
			if (!_.isUndefined(data.id)) {
				data.id = parseInt(data.id, 10);
			}

			if( options ){
				if (options.filesClient) {
					this._filesClient = options.filesClient;
				}
			}
		},

		/**
		 * Returns whether this file is a directory
		 *
		 * @return {boolean} true if this is a directory, false otherwise
		 */
		isDirectory: function() {
			return this.get('mimetype') === 'httpd/unix-directory';
		},

		/**
		 * Returns whether this file is an image
		 *
		 * @return {boolean} true if this is an image, false otherwise
		 */
		isImage: function() {
			if (!this.has('mimetype')) {
				return false;
			}
			return this.get('mimetype').substr(0, 6) === 'image/'
				|| this.get('mimetype') === 'application/postscript'
				|| this.get('mimetype') === 'application/illustrator'
				|| this.get('mimetype') === 'application/x-photoshop';
		},

		/**
		 * Returns the full path to this file
		 *
		 * @return {string} full path
		 */
		getFullPath: function() {
			return OC.joinPaths(this.get('path'), this.get('name'));
		},

		/**
		 * Reloads missing properties from server and set them in the model.
		 * @param properties array of properties to be reloaded
		 * @return ajax call object
		 */
		reloadProperties: function(properties) {
			if( !this._filesClient ){
				return;
			}

			var self = this;
			var deferred = $.Deferred();

			var targetPath = OC.joinPaths(this.get('path') + '/', this.get('name'));

			this._filesClient.getFileInfo(targetPath, {
					properties: properties
				})
				.then(function(status, data) {
					// the following lines should be extracted to a mapper

					if( properties.indexOf(OC.Files.Client.PROPERTY_GETCONTENTLENGTH) !== -1
					||  properties.indexOf(OC.Files.Client.PROPERTY_SIZE) !== -1 ) {
						self.set('size', data.size);
					}

					deferred.resolve(status, data);
				})
				.fail(function(status) {
					OC.Notification.show(t('files', 'Could not load info for file "{file}"', {file: self.get('name')}), {type: 'error'});
					deferred.reject(status);
				});

			return deferred.promise();
		}
	});

	if (!OCA.Files) {
		OCA.Files = {};
	}
	OCA.Files.FileInfoModel = FileInfoModel;

})(OC, OCA);


/**
* ownCloud
*
* @author Vincent Petry
* @copyright 2014 Vincent Petry <pvince81@owncloud.com>
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

(function() {
	var INFO_TEMPLATE =
		'<span class="info">' +
			'<span class="dirinfo"></span>' +
			'<span class="connector">{{connectorLabel}}</span>' +
			'<span class="fileinfo"></span>' +
			'<span class="hiddeninfo"></span>' +
			'<span class="filter"></span>' +
		'</span>';

	/**
	 * The FileSummary class encapsulates the file summary values and
	 * the logic to render it in the given container
	 *
	 * @constructs FileSummary
	 * @memberof OCA.Files
	 *
	 * @param $tr table row element
	 * @param {OC.Backbone.Model} [options.filesConfig] files app configuration
	 */
	var FileSummary = function($tr, options) {
		options = options || {};
		var self = this;
		this.$el = $tr;
		var filesConfig = options.config;
		if (filesConfig) {
			this._showHidden = !!filesConfig.get('showhidden');
			filesConfig.on('change:showhidden', function() {
				self._showHidden = !!this.get('showhidden');
				self.update();
			});
		}
		this.clear();
		this.render();
	};

	FileSummary.prototype = {
		_showHidden: null,

		summary: {
			totalFiles: 0,
			totalDirs: 0,
			totalHidden: 0,
			totalSize: 0,
			filter:'',
			sumIsPending:false
		},

		/**
		 * Returns whether the given file info must be hidden
		 *
		 * @param {OC.Files.FileInfo} fileInfo file info
		 * 
		 * @return {boolean} true if the file is a hidden file, false otherwise
		 */
		_isHiddenFile: function(file) {
			return file.name && file.name.charAt(0) === '.';
		},

		/**
		 * Adds file
		 * @param {OC.Files.FileInfo} file file to add
		 * @param {boolean} update whether to update the display
		 */
		add: function(file, update) {
			if (file.name && file.name.toLowerCase().indexOf(this.summary.filter) === -1) {
				return;
			}
			if (file.type === 'dir' || file.mime === 'httpd/unix-directory') {
				this.summary.totalDirs++;
			}
			else {
				this.summary.totalFiles++;
			}
			if (this._isHiddenFile(file)) {
				this.summary.totalHidden++;
			}

			var size = parseInt(file.size, 10) || 0;
			if (size >=0) {
				this.summary.totalSize += size;
			} else {
				this.summary.sumIsPending = true;
			}
			if (!!update) {
				this.update();
			}
		},
		/**
		 * Removes file
		 * @param {OC.Files.FileInfo} file file to remove
		 * @param {boolean} update whether to update the display
		 */
		remove: function(file, update) {
			if (file.name && file.name.toLowerCase().indexOf(this.summary.filter) === -1) {
				return;
			}
			if (file.type === 'dir' || file.mime === 'httpd/unix-directory') {
				this.summary.totalDirs--;
			}
			else {
				this.summary.totalFiles--;
			}
			if (this._isHiddenFile(file)) {
				this.summary.totalHidden--;
			}
			var size = parseInt(file.size, 10) || 0;
			if (size >=0) {
				this.summary.totalSize -= size;
			}
			if (!!update) {
				this.update();
			}
		},
		setFilter: function(filter, files){
			this.summary.filter = filter.toLowerCase();
			this.calculate(files);
		},
		/**
		 * Returns the total of files and directories
		 */
		getTotal: function() {
			return this.summary.totalDirs + this.summary.totalFiles;
		},
		/**
		 * Recalculates the summary based on the given files array
		 * @param files array of files
		 */
		calculate: function(files) {
			var file;
			var summary = {
				totalDirs: 0,
				totalFiles: 0,
				totalHidden: 0,
				totalSize: 0,
				filter: this.summary.filter,
				sumIsPending: false
			};

			for (var i = 0; i < files.length; i++) {
				file = files[i];
				if (file.name && file.name.toLowerCase().indexOf(this.summary.filter) === -1) {
					continue;
				}
				if (file.type === 'dir' || file.mime === 'httpd/unix-directory') {
					summary.totalDirs++;
				}
				else {
					summary.totalFiles++;
				}
				if (this._isHiddenFile(file)) {
					summary.totalHidden++;
				}
				var size = parseInt(file.size, 10) || 0;
				if (size >=0) {
					summary.totalSize += size;
				} else {
					summary.sumIsPending = true;
				}
			}
			this.setSummary(summary);
		},
		/**
		 * Clears the summary
		 */
		clear: function() {
			this.calculate([]);
		},
		/**
		 * Sets the current summary values
		 * @param summary map
		 */
		setSummary: function(summary) {
			this.summary = summary;
			if (typeof this.summary.filter === 'undefined') {
				this.summary.filter = '';
			}
			this.update();
		},

		_infoTemplate: function(data) {
			if (!this._infoTemplateCompiled) {
				this._infoTemplateCompiled = Handlebars.compile(INFO_TEMPLATE);
			}
			return this._infoTemplateCompiled(_.extend({
				connectorLabel: t('files', '{dirs} and {files}', {dirs: '', files: ''})
			}, data));
		},

		/**
		 * Renders the file summary element
		 */
		update: function() {
			if (!this.$el) {
				return;
			}
			if (!this.summary.totalFiles && !this.summary.totalDirs) {
				this.$el.addClass('hidden');
				return;
			}
			// There's a summary and data -> Update the summary
			this.$el.removeClass('hidden');
			var $dirInfo = this.$el.find('.dirinfo');
			var $fileInfo = this.$el.find('.fileinfo');
			var $connector = this.$el.find('.connector');
			var $filterInfo = this.$el.find('.filter');
			var $hiddenInfo = this.$el.find('.hiddeninfo');

			// Substitute old content with new translations
			$dirInfo.html(n('files', '%n folder', '%n folders', this.summary.totalDirs));
			$fileInfo.html(n('files', '%n file', '%n files', this.summary.totalFiles));
			$hiddenInfo.html(' (' + n('files', 'including %n hidden', 'including %n hidden', this.summary.totalHidden) + ')');
			var fileSize = this.summary.sumIsPending ? t('files', 'Pending') : OC.Util.humanFileSize(this.summary.totalSize);
			this.$el.find('.filesize').html(fileSize);

			// Show only what's necessary (may be hidden)
			if (this.summary.totalDirs === 0) {
				$dirInfo.addClass('hidden');
				$connector.addClass('hidden');
			} else {
				$dirInfo.removeClass('hidden');
			}
			if (this.summary.totalFiles === 0) {
				$fileInfo.addClass('hidden');
				$connector.addClass('hidden');
			} else {
				$fileInfo.removeClass('hidden');
			}
			if (this.summary.totalDirs > 0 && this.summary.totalFiles > 0) {
				$connector.removeClass('hidden');
			}
			$hiddenInfo.toggleClass('hidden', this.summary.totalHidden === 0 || this._showHidden)
			if (this.summary.filter === '') {
				$filterInfo.html('');
				$filterInfo.addClass('hidden');
			} else {
				$filterInfo.html(' ' + n('files', 'matches \'{filter}\'', 'match \'{filter}\'', this.summary.totalDirs + this.summary.totalFiles, {filter: this.summary.filter}));
				$filterInfo.removeClass('hidden');
			}
		},
		render: function() {
			if (!this.$el) {
				return;
			}
			var summary = this.summary;

			// don't show the filesize column, if filesize is NaN (e.g. in trashbin)
			var fileSize = '';
			if (!isNaN(summary.totalSize)) {
				fileSize = summary.sumIsPending ? t('files', 'Pending') : OC.Util.humanFileSize(summary.totalSize);
				fileSize = '<td class="filesize">' + fileSize + '</td>';
			}

			var $summary = $(
				'<td>' + this._infoTemplate() + '</td>' +
				fileSize +
				'<td class="date"></td>'
			);
			this.$el.addClass('hidden');
			this.$el.append($summary);
			this.update();
		}
	};
	OCA.Files.FileSummary = FileSummary;
})();



/**
* ownCloud
*
* @author Vincent Petry
* @copyright 2014 Vincent Petry <pvince81@owncloud.com>
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

(function() {
	/**
	 * @class BreadCrumb
	 * @memberof OCA.Files
	 * @classdesc Breadcrumbs that represent the current path.
	 *
	 * @param {Object} [options] options
	 * @param {Function} [options.onClick] click event handler
	 * @param {Function} [options.onDrop] drop event handler
	 * @param {Function} [options.getCrumbUrl] callback that returns
	 * the URL of a given breadcrumb
	 */
	var BreadCrumb = function(options){
		this.$el = $('<div class="breadcrumb"></div>');
		this.$menu = $('<div class="popovermenu menu-center"><ul></ul></div>');

		this.crumbSelector = '.crumb:not(.hidden):not(.crumbhome):not(.crumbmenu)';
		options = options || {};
		if (options.onClick) {
			this.onClick = options.onClick;
		}
		if (options.onDrop) {
			this.onDrop = options.onDrop;
			this.onOver = options.onOver;
			this.onOut = options.onOut;
		}
		if (options.getCrumbUrl) {
			this.getCrumbUrl = options.getCrumbUrl;
		}
		this._detailViews = [];
	};

	/**
	 * @memberof OCA.Files
	 */
	BreadCrumb.prototype = {
		$el: null,
		dir: null,
		dirInfo: null,

		/**
		 * Total width of all breadcrumbs
		 * @type int
		 * @private
		 */
		totalWidth: 0,
		breadcrumbs: [],
		onClick: null,
		onDrop: null,
		onOver: null,
		onOut: null,

		/**
		 * Sets the directory to be displayed as breadcrumb.
		 * This will re-render the breadcrumb.
		 * @param dir path to be displayed as breadcrumb
		 */
		setDirectory: function(dir) {
			dir = dir.replace(/\\/g, '/');
			dir = dir || '/';
			if (dir !== this.dir) {
				this.dir = dir;
				this.render();
			}
		},

		setDirectoryInfo: function(dirInfo) {
			if (dirInfo !== this.dirInfo) {
				this.dirInfo = dirInfo;
				this.render();
			}
		},

		/**
		 * @param {Backbone.View} detailView
		 */
		addDetailView: function(detailView) {
			this._detailViews.push(detailView);
		},

		/**
		 * Returns the full URL to the given directory
		 *
		 * @param {Object.<String, String>} part crumb data as map
		 * @param {int} index crumb index
		 * @return full URL
		 */
		getCrumbUrl: function(part, index) {
			return '#';
		},

		/**
		 * Renders the breadcrumb elements
		 */
		render: function() {
			// Menu is destroyed on every change, we need to init it
			OC.unregisterMenu($('.crumbmenu'), $('.crumbmenu > .popovermenu'));

			var parts = this._makeCrumbs(this.dir || '/');
			var $crumb;
			var $menuItem;
			this.$el.empty();
			this.breadcrumbs = [];

			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				var $image;
				var $link = $('<a></a>');
				$crumb = $('<div class="crumb svg"></div>');
				if(part.dir) {
					$link.attr('href', this.getCrumbUrl(part, i));
				}
				if(part.name) {
					$link.text(part.name);
				}
				$link.addClass(part.linkclass);
				$crumb.append($link);
				$crumb.data('dir', part.dir);
				// Ignore menu button
				$crumb.data('crumb-id', i - 1);
				$crumb.addClass(part.class);

				if (part.img) {
					$image = $('<img class="svg"></img>');
					$image.attr('src', part.img);
					$image.attr('alt', part.alt);
					$link.append($image);
				}
				this.breadcrumbs.push($crumb);
				this.$el.append($crumb);
				// Only add feedback if not menu
				if (this.onClick && i !== 0) {
					$link.on('click', this.onClick);
				}
			}

			// Menu creation
			this._createMenu();
			for (var j = 0; j < parts.length; j++) {
				var menuPart = parts[j];
				if(menuPart.dir) {
					$menuItem = $('<li class="crumblist"><a><span class="icon-folder"></span><span></span></a></li>');
					$menuItem.data('dir', menuPart.dir);
					$menuItem.find('a').attr('href', this.getCrumbUrl(part, j));
					$menuItem.find('span:eq(1)').text(menuPart.name);
					this.$menu.children('ul').append($menuItem);
					if (this.onClick) {
						$menuItem.on('click', this.onClick);
					}
				}
			}
			_.each(this._detailViews, function(view) {
				view.render({
					dirInfo: this.dirInfo
				});
				$crumb.append(view.$el);
			}, this);

			// in case svg is not supported by the browser we need to execute the fallback mechanism
			if (!OC.Util.hasSVGSupport()) {
				OC.Util.replaceSVG(this.$el);
			}

			// setup drag and drop
			if (this.onDrop) {
				this.$el.find('.crumb:not(:last-child):not(.crumbmenu), .crumblist:not(:last-child)').droppable({
					drop: this.onDrop,
					over: this.onOver,
					out: this.onOut,
					tolerance: 'pointer',
					hoverClass: 'canDrop',
					greedy: true
				});
			}

			// Menu is destroyed on every change, we need to init it
			OC.registerMenu($('.crumbmenu'), $('.crumbmenu > .popovermenu'));

			this._resize();
		},

		/**
		 * Makes a breadcrumb structure based on the given path
		 *
		 * @param {String} dir path to split into a breadcrumb structure
		 * @return {Object.<String, String>} map of {dir: path, name: displayName}
		 */
		_makeCrumbs: function(dir) {
			var crumbs = [];
			var pathToHere = '';
			// trim leading and trailing slashes
			dir = dir.replace(/^\/+|\/+$/g, '');
			var parts = dir.split('/');
			if (dir === '') {
				parts = [];
			}
			// menu part
			crumbs.push({
				class: 'crumbmenu hidden',
				linkclass: 'icon-more'
			});
			// root part
			crumbs.push({
				name: t('core', 'Home'),
				dir: '/',
				class: 'crumbhome',
				linkclass: 'icon-home'
			});
			for (var i = 0; i < parts.length; i++) {
				var part = parts[i];
				pathToHere = pathToHere + '/' + part;
				crumbs.push({
					dir: pathToHere,
					name: part
				});
			}
			return crumbs;
		},

		/**
		 * Show/hide breadcrumbs to fit the given width
		 * Mostly used by tests
		 *
		 * @param {int} availableWidth available width
		 */
		setMaxWidth: function (availableWidth) {
			if (this.availableWidth !== availableWidth) {
				this.availableWidth = availableWidth;
				this._resize();
			}
		},

		/**
		 * Calculate real width based on individual crumbs
		 * More accurate and works with tests
		 *
		 * @param {boolean} ignoreHidden ignore hidden crumbs
		 */
		getTotalWidth: function(ignoreHidden) {
			var totalWidth = 0;
			for (var i = 0; i < this.breadcrumbs.length; i++ ) {
				var $crumb = $(this.breadcrumbs[i]);
				if(!$crumb.hasClass('hidden') || ignoreHidden === true) {
					totalWidth += $crumb.outerWidth();
				}
			}
			return totalWidth;
		},

 		/**
 		 * Hide the middle crumb
 		 */
 		_hideCrumb: function() {
			var length = this.$el.find(this.crumbSelector).length;
			// Get the middle one floored down
			var elmt = Math.floor(length / 2 - 0.5);
			this.$el.find(this.crumbSelector+':eq('+elmt+')').addClass('hidden');
 		},

 		/**
 		 * Get the crumb to show
 		 */
 		_getCrumbElement: function() {
			var hidden = this.$el.find('.crumb.hidden').length;
			var shown = this.$el.find(this.crumbSelector).length;
			// Get the outer one with priority to the highest
			var elmt = (1 - shown % 2) * (hidden - 1);
			return this.$el.find('.crumb.hidden:eq('+elmt+')');
		},

 		/**
 		 * Show the middle crumb
 		 */
 		_showCrumb: function() {
			if(this.$el.find('.crumb.hidden').length === 1) {
				this.$el.find('.crumb.hidden').removeClass('hidden');
			}
			this._getCrumbElement().removeClass('hidden');
 		},

		/**
		 * Create and append the popovermenu
		 */
		_createMenu: function() {
			this.$el.find('.crumbmenu').append(this.$menu);
			this.$menu.children('ul').empty();
		},

		/**
		 * Update the popovermenu
		 */
		_updateMenu: function() {
			var menuItems = this.$el.find('.crumb.hidden');
			// Hide the crumb menu if no elements
			this.$el.find('.crumbmenu').toggleClass('hidden', menuItems.length === 0);

			this.$menu.find('li').addClass('in-breadcrumb');
			for (var i = 0; i < menuItems.length; i++) {
				var crumbId = $(menuItems[i]).data('crumb-id');
				this.$menu.find('li:eq('+crumbId+')').removeClass('in-breadcrumb');
			}
		},

		_resize: function() {

			if (this.breadcrumbs.length <= 2) {
				// home & menu
				return;
			}

			// Used for testing since this.$el.parent fails
			if (!this.availableWidth) {
				this.usedWidth = this.$el.parent().width() - this.$el.parent().find('.actions.creatable').width();
			} else {
				this.usedWidth = this.availableWidth;
			}

			// If container is smaller than content
			// AND if there are crumbs left to hide
			while (this.getTotalWidth() > this.usedWidth
				&& this.$el.find(this.crumbSelector).length > 0) {
				this._hideCrumb();
			}
			// If container is bigger than content + element to be shown
			// AND if there is at least one hidden crumb
			while (this.$el.find('.crumb.hidden').length > 0
				&& this.getTotalWidth() + this._getCrumbElement().width() < this.usedWidth) {
				this._showCrumb();
			}

			this._updateMenu();
		}
	};

	OCA.Files.BreadCrumb = BreadCrumb;
})();


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	var TEMPLATE_ADDBUTTON = '<a href="#" class="button new">' +
		'<span class="icon {{iconClass}}"></span>' +
		'<span class="hidden-visually">{{addText}}</span>' +
		'</a>';

	/**
	 * @class OCA.Files.FileList
	 * @classdesc
	 *
	 * The FileList class manages a file list view.
	 * A file list view consists of a controls bar and
	 * a file list table.
	 *
	 * @param $el container element with existing markup for the #controls
	 * and a table
	 * @param {Object} [options] map of options, see other parameters
	 * @param {Object} [options.scrollContainer] scrollable container, defaults to $(window)
	 * @param {Object} [options.dragOptions] drag options, disabled by default
	 * @param {Object} [options.folderDropOptions] folder drop options, disabled by default
	 * @param {boolean} [options.detailsViewEnabled=true] whether to enable details view
	 * @param {boolean} [options.enableUpload=false] whether to enable uploader
	 * @param {OC.Files.Client} [options.filesClient] files client to use
	 */
	var FileList = function($el, options) {
		this.initialize($el, options);
	};
	/**
	 * @memberof OCA.Files
	 */
	FileList.prototype = {
		SORT_INDICATOR_ASC_CLASS: 'icon-triangle-n',
		SORT_INDICATOR_DESC_CLASS: 'icon-triangle-s',

		id: 'files',
		appName: t('files', 'Files'),
		isEmpty: true,
		useUndo:true,

		/**
		 * Top-level container with controls and file list
		 */
		$el: null,

		/**
		 * Files table
		 */
		$table: null,

		/**
		 * List of rows (table tbody)
		 */
		$fileList: null,

		/**
		 * @type OCA.Files.BreadCrumb
		 */
		breadcrumb: null,

		/**
		 * @type OCA.Files.FileSummary
		 */
		fileSummary: null,

		/**
		 * @type OCA.Files.DetailsView
		 */
		_detailsView: null,

		/**
		 * Files client instance
		 *
		 * @type OC.Files.Client
		 */
		filesClient: null,

		/**
		 * Whether the file list was initialized already.
		 * @type boolean
		 */
		initialized: false,

		/**
		 * Wheater the file list was already shown once
		 * @type boolean
		 */
		shown: false,

		/**
		 * Number of files per page
		 *
		 * @return {int} page size
		 */
		pageSize: function() {
			return Math.ceil(this.$container.height() / 50);
		},

		/**
		 * Array of files in the current folder.
		 * The entries are of file data.
		 *
		 * @type Array.<OC.Files.FileInfo>
		 */
		files: [],

		/**
		 * Current directory entry
		 *
		 * @type OC.Files.FileInfo
		 */
		dirInfo: null,

		/**
		 * File actions handler, defaults to OCA.Files.FileActions
		 * @type OCA.Files.FileActions
		 */
		fileActions: null,

		/**
		 * Whether selection is allowed, checkboxes and selection overlay will
		 * be rendered
		 */
		_allowSelection: true,

		/**
		 * Map of file id to file data
		 * @type Object.<int, Object>
		 */
		_selectedFiles: {},

		/**
		 * Summary of selected files.
		 * @type OCA.Files.FileSummary
		 */
		_selectionSummary: null,

		/**
		 * If not empty, only files containing this string will be shown
		 * @type String
		 */
		_filter: '',

		/**
		 * @type Backbone.Model
		 */
		_filesConfig: undefined,

		/**
		 * Sort attribute
		 * @type String
		 */
		_sort: 'name',

		/**
		 * Sort direction: 'asc' or 'desc'
		 * @type String
		 */
		_sortDirection: 'asc',

		/**
		 * Sort comparator function for the current sort
		 * @type Function
		 */
		_sortComparator: null,

		/**
		 * Whether to do a client side sort.
		 * When false, clicking on a table header will call reload().
		 * When true, clicking on a table header will simply resort the list.
		 */
		_clientSideSort: true,

		/**
		 * Whether or not users can change the sort attribute or direction
		 */
		_allowSorting: true,

		/**
		 * Current directory
		 * @type String
		 */
		_currentDirectory: null,

		_dragOptions: null,
		_folderDropOptions: null,

		/**
		 * @type OC.Uploader
		 */
		_uploader: null,

		/**
		 * Initialize the file list and its components
		 *
		 * @param $el container element with existing markup for the #controls
		 * and a table
		 * @param options map of options, see other parameters
		 * @param options.scrollContainer scrollable container, defaults to $(window)
		 * @param options.dragOptions drag options, disabled by default
		 * @param options.folderDropOptions folder drop options, disabled by default
		 * @param options.scrollTo name of file to scroll to after the first load
		 * @param {OC.Files.Client} [options.filesClient] files API client
		 * @param {OC.Backbone.Model} [options.filesConfig] files app configuration
		 * @private
		 */
		initialize: function($el, options) {
			var self = this;
			options = options || {};
			if (this.initialized) {
				return;
			}

			if (options.config) {
				this._filesConfig = options.config;
			} else if (!_.isUndefined(OCA.Files) && !_.isUndefined(OCA.Files.App)) {
				this._filesConfig = OCA.Files.App.getFilesConfig();
			} else {
				this._filesConfig = new OC.Backbone.Model({
					'showhidden': false
				});
			}

			if (options.dragOptions) {
				this._dragOptions = options.dragOptions;
			}
			if (options.folderDropOptions) {
				this._folderDropOptions = options.folderDropOptions;
			}
			if (options.filesClient) {
				this.filesClient = options.filesClient;
			} else {
				// default client if not specified
				this.filesClient = OC.Files.getClient();
			}

			this.$el = $el;
			if (options.id) {
				this.id = options.id;
			}
			this.$container = options.scrollContainer || $(window);
			this.$table = $el.find('table:first');
			this.$fileList = $el.find('#fileList');

			if (!_.isUndefined(this._filesConfig)) {
				this._filesConfig.on('change:showhidden', function() {
					var showHidden = this.get('showhidden');
					self.$el.toggleClass('hide-hidden-files', !showHidden);
					self.updateSelectionSummary();

					if (!showHidden) {
						// hiding files could make the page too small, need to try rendering next page
						self._onScroll();
					}
				});

				this.$el.toggleClass('hide-hidden-files', !this._filesConfig.get('showhidden'));
			}


			if (_.isUndefined(options.detailsViewEnabled) || options.detailsViewEnabled) {
				this._detailsView = new OCA.Files.DetailsView();
				this._detailsView.$el.insertBefore(this.$el);
				this._detailsView.$el.addClass('disappear');
			}

			this._initFileActions(options.fileActions);

			if (this._detailsView) {
				this._detailsView.addDetailView(new OCA.Files.MainFileInfoDetailView({fileList: this, fileActions: this.fileActions}));
			}

			this.files = [];
			this._selectedFiles = {};
			this._selectionSummary = new OCA.Files.FileSummary(undefined, {config: this._filesConfig});
			// dummy root dir info
			this.dirInfo = new OC.Files.FileInfo({});

			this.fileSummary = this._createSummary();

			if (options.sorting) {
				this.setSort(options.sorting.mode, options.sorting.direction, false, false);
			} else {
				this.setSort('name', 'asc', false, false);
			}

			var breadcrumbOptions = {
				onClick: _.bind(this._onClickBreadCrumb, this),
				getCrumbUrl: function(part) {
					return self.linkTo(part.dir);
				}
			};
			// if dropping on folders is allowed, then also allow on breadcrumbs
			if (this._folderDropOptions) {
				breadcrumbOptions.onDrop = _.bind(this._onDropOnBreadCrumb, this);
				breadcrumbOptions.onOver = function() {
					self.$el.find('td.filename.ui-droppable').droppable('disable');
				}
				breadcrumbOptions.onOut = function() {
					self.$el.find('td.filename.ui-droppable').droppable('enable');
				}
			}
			this.breadcrumb = new OCA.Files.BreadCrumb(breadcrumbOptions);

			var $controls = this.$el.find('#controls');
			if ($controls.length > 0) {
				$controls.prepend(this.breadcrumb.$el);
				this.$table.addClass('has-controls');
			}

			this._renderNewButton();

			this.$el.find('thead th .columntitle').click(_.bind(this._onClickHeader, this));

			this._onResize = _.debounce(_.bind(this._onResize, this), 250);
			$('#app-content').on('appresized', this._onResize);
			$(window).resize(this._onResize);

			this.$el.on('show', this._onResize);

			this.updateSearch();

			this.$fileList.on('click','td.filename>a.name, td.filesize, td.date', _.bind(this._onClickFile, this));

			this.$fileList.on('change', 'td.selection>.selectCheckBox', _.bind(this._onClickFileCheckbox, this));
			this.$el.on('show', _.bind(this._onShow, this));
			this.$el.on('urlChanged', _.bind(this._onUrlChanged, this));
			this.$el.find('.select-all').click(_.bind(this._onClickSelectAll, this));
			this.$el.find('.download').click(_.bind(this._onClickDownloadSelected, this));
			this.$el.find('.copy-move').click(_.bind(this._onClickCopyMoveSelected, this));
			this.$el.find('.delete-selected').click(_.bind(this._onClickDeleteSelected, this));

			this.$el.find('.selectedActions a').tooltip({placement:'top'});

			this.$container.on('scroll', _.bind(this._onScroll, this));

			if (options.scrollTo) {
				this.$fileList.one('updated', function() {
					self.scrollTo(options.scrollTo);
				});
			}

			if (options.enableUpload) {
				// TODO: auto-create this element
				var $uploadEl = this.$el.find('#file_upload_start');
				if ($uploadEl.exists()) {
					this._uploader = new OC.Uploader($uploadEl, {
						fileList: this,
						filesClient: this.filesClient,
						dropZone: $('#content'),
						maxChunkSize: options.maxChunkSize
					});

					this.setupUploadEvents(this._uploader);
				}
			}

			OC.Plugins.attach('OCA.Files.FileList', this);
		},

		/**
		 * Destroy / uninitialize this instance.
		 */
		destroy: function() {
			if (this._newFileMenu) {
				this._newFileMenu.remove();
			}
			if (this._newButton) {
				this._newButton.remove();
			}
			if (this._detailsView) {
				this._detailsView.remove();
			}
			// TODO: also unregister other event handlers
			this.fileActions.off('registerAction', this._onFileActionsUpdated);
			this.fileActions.off('setDefault', this._onFileActionsUpdated);
			OC.Plugins.detach('OCA.Files.FileList', this);
			$('#app-content').off('appresized', this._onResize);
		},

		/**
		 * Initializes the file actions, set up listeners.
		 *
		 * @param {OCA.Files.FileActions} fileActions file actions
		 */
		_initFileActions: function(fileActions) {
			var self = this;
			this.fileActions = fileActions;
			if (!this.fileActions) {
				this.fileActions = new OCA.Files.FileActions();
				this.fileActions.registerDefaultActions();
			}

			if (this._detailsView) {
				this.fileActions.registerAction({
					name: 'Details',
					displayName: t('files', 'Details'),
					mime: 'all',
					order: -50,
					iconClass: 'icon-details',
					permissions: OC.PERMISSION_NONE,
					actionHandler: function(fileName, context) {
						self._updateDetailsView(fileName);
					}
				});
			}

			this._onFileActionsUpdated = _.debounce(_.bind(this._onFileActionsUpdated, this), 100);
			this.fileActions.on('registerAction', this._onFileActionsUpdated);
			this.fileActions.on('setDefault', this._onFileActionsUpdated);
		},

		/**
		 * Returns a unique model for the given file name.
		 *
		 * @param {string|object} fileName file name or jquery row
		 * @return {OCA.Files.FileInfoModel} file info model
		 */
		getModelForFile: function(fileName) {
			var self = this;
			var $tr;
			// jQuery object ?
			if (fileName.is) {
				$tr = fileName;
				fileName = $tr.attr('data-file');
			} else {
				$tr = this.findFileEl(fileName);
			}

			if (!$tr || !$tr.length) {
				return null;
			}

			// if requesting the selected model, return it
			if (this._currentFileModel && this._currentFileModel.get('name') === fileName) {
				return this._currentFileModel;
			}

			// TODO: note, this is a temporary model required for synchronising
			// state between different views.
			// In the future the FileList should work with Backbone.Collection
			// and contain existing models that can be used.
			// This method would in the future simply retrieve the matching model from the collection.
			var model = new OCA.Files.FileInfoModel(this.elementToFile($tr), {
				filesClient: this.filesClient
			});
			if (!model.get('path')) {
				model.set('path', this.getCurrentDirectory(), {silent: true});
			}

			model.on('change', function(model) {
				// re-render row
				var highlightState = $tr.hasClass('highlighted');
				$tr = self.updateRow(
					$tr,
					model.toJSON(),
					{updateSummary: true, silent: false, animate: true}
				);

				// restore selection state
				var selected = !!self._selectedFiles[$tr.data('id')];
				self._selectFileEl($tr, selected);

				$tr.toggleClass('highlighted', highlightState);
			});
			model.on('busy', function(model, state) {
				self.showFileBusyState($tr, state);
			});

			return model;
		},

		/**
		 * Displays the details view for the given file and
		 * selects the given tab
		 *
		 * @param {string|OCA.Files.FileInfoModel} fileName file name or FileInfoModel for which to show details
		 * @param {string} [tabId] optional tab id to select
		 */
		showDetailsView: function(fileName, tabId) {
			this._updateDetailsView(fileName);
			if (tabId) {
				this._detailsView.selectTab(tabId);
			}
			OC.Apps.showAppSidebar(this._detailsView.$el);
		},

		/**
		 * Update the details view to display the given file
		 *
		 * @param {string|OCA.Files.FileInfoModel} fileName file name from the current list or a FileInfoModel object
		 * @param {boolean} [show=true] whether to open the sidebar if it was closed
		 */
		_updateDetailsView: function(fileName, show) {
			if (!this._detailsView) {
				return;
			}

			// show defaults to true
			show = _.isUndefined(show) || !!show;
			var oldFileInfo = this._detailsView.getFileInfo();
			if (oldFileInfo) {
				// TODO: use more efficient way, maybe track the highlight
				this.$fileList.children().filterAttr('data-id', '' + oldFileInfo.get('id')).removeClass('highlighted');
				oldFileInfo.off('change', this._onSelectedModelChanged, this);
			}

			if (!fileName) {
				this._detailsView.setFileInfo(null);
				if (this._currentFileModel) {
					this._currentFileModel.off();
				}
				this._currentFileModel = null;
				OC.Apps.hideAppSidebar(this._detailsView.$el);
				return;
			}

			if (show && this._detailsView.$el.hasClass('disappear')) {
				OC.Apps.showAppSidebar(this._detailsView.$el);
			}

			if (fileName instanceof OCA.Files.FileInfoModel) {
				var model = fileName;
			} else {
				var $tr = this.findFileEl(fileName);
				var model = this.getModelForFile($tr);
				$tr.addClass('highlighted');
			}

			this._currentFileModel = model;

			this._detailsView.setFileInfo(model);
			this._detailsView.$el.scrollTop(0);
		},

		/**
		 * Event handler for when the window size changed
		 */
		_onResize: function() {
			var containerWidth = this.$el.width();
			var actionsWidth = 0;
			$.each(this.$el.find('#controls .actions'), function(index, action) {
				actionsWidth += $(action).outerWidth();
			});

			this.breadcrumb._resize();

			this.$table.find('>thead').width($('#app-content').width() - OC.Util.getScrollBarWidth());
		},

		/**
		 * Event handler when leaving previously hidden state
		 */
		_onShow: function(e) {
			if (this.shown) {
				this._setCurrentDir('/', false);
				this.reload();
			}
			this.shown = true;
		},

		/**
		 * Event handler for when the URL changed
		 */
		_onUrlChanged: function(e) {
			if (e && _.isString(e.dir)) {
				var currentDir = this.getCurrentDirectory();
				// this._currentDirectory is NULL when fileList is first initialised
				if( (this._currentDirectory || this.$el.find('#dir').val()) && currentDir === e.dir) {
					return;
				}
				this.changeDirectory(e.dir, false, true);
			}
		},

		/**
		 * Selected/deselects the given file element and updated
		 * the internal selection cache.
		 *
		 * @param {Object} $tr single file row element
		 * @param {bool} state true to select, false to deselect
		 */
		_selectFileEl: function($tr, state, showDetailsView) {
			var $checkbox = $tr.find('td.selection>.selectCheckBox');
			var oldData = !!this._selectedFiles[$tr.data('id')];
			var data;
			$checkbox.prop('checked', state);
			$tr.toggleClass('selected', state);
			// already selected ?
			if (state === oldData) {
				return;
			}
			data = this.elementToFile($tr);
			if (state) {
				this._selectedFiles[$tr.data('id')] = data;
				this._selectionSummary.add(data);
			}
			else {
				delete this._selectedFiles[$tr.data('id')];
				this._selectionSummary.remove(data);
			}
			if (this._detailsView && !this._detailsView.$el.hasClass('disappear')) {
				// hide sidebar
				this._updateDetailsView(null);
			}
			this.$el.find('.select-all').prop('checked', this._selectionSummary.getTotal() === this.files.length);
		},

		/**
		 * Event handler for when clicking on files to select them
		 */
		_onClickFile: function(event) {
			var $tr = $(event.target).closest('tr');
			if ($tr.hasClass('dragging')) {
				return;
			}
			if (this._allowSelection && (event.ctrlKey || event.shiftKey)) {
				event.preventDefault();
				if (event.shiftKey) {
					var $lastTr = $(this._lastChecked);
					var lastIndex = $lastTr.index();
					var currentIndex = $tr.index();
					var $rows = this.$fileList.children('tr');

					// last clicked checkbox below current one ?
					if (lastIndex > currentIndex) {
						var aux = lastIndex;
						lastIndex = currentIndex;
						currentIndex = aux;
					}

					// auto-select everything in-between
					for (var i = lastIndex + 1; i < currentIndex; i++) {
						this._selectFileEl($rows.eq(i), true);
					}
				}
				else {
					this._lastChecked = $tr;
				}
				var $checkbox = $tr.find('td.selection>.selectCheckBox');
				this._selectFileEl($tr, !$checkbox.prop('checked'));
				this.updateSelectionSummary();
			} else {
				// clicked directly on the name
				if (!this._detailsView || $(event.target).is('.nametext') || $(event.target).closest('.nametext').length) {
					var filename = $tr.attr('data-file');
					var renaming = $tr.data('renaming');
					if (!renaming) {
						this.fileActions.currentFile = $tr.find('td');
						var mime = this.fileActions.getCurrentMimeType();
						var type = this.fileActions.getCurrentType();
						var permissions = this.fileActions.getCurrentPermissions();
						var action = this.fileActions.getDefault(mime,type, permissions);
						if (action) {
							event.preventDefault();
							// also set on global object for legacy apps
							window.FileActions.currentFile = this.fileActions.currentFile;
							action(filename, {
								$file: $tr,
								fileList: this,
								fileActions: this.fileActions,
								dir: $tr.attr('data-path') || this.getCurrentDirectory()
							});
						}
						// deselect row
						$(event.target).closest('a').blur();
					}
				} else {
					// Even if there is no Details action the default event
					// handler is prevented for consistency (although there
					// should always be a Details action); otherwise the link
					// would be downloaded by the browser when the user expected
					// the details to be shown.
					event.preventDefault();
					var filename = $tr.attr('data-file');
					this.fileActions.currentFile = $tr.find('td');
					var mime = this.fileActions.getCurrentMimeType();
					var type = this.fileActions.getCurrentType();
					var permissions = this.fileActions.getCurrentPermissions();
					var action = this.fileActions.get(mime, type, permissions)['Details'];
					if (action) {
						// also set on global object for legacy apps
						window.FileActions.currentFile = this.fileActions.currentFile;
						action(filename, {
							$file: $tr,
							fileList: this,
							fileActions: this.fileActions,
							dir: $tr.attr('data-path') || this.getCurrentDirectory()
						});
					}
				}
			}
		},

		/**
		 * Event handler for when clicking on a file's checkbox
		 */
		_onClickFileCheckbox: function(e) {
			var $tr = $(e.target).closest('tr');
			var state = !$tr.hasClass('selected');
			this._selectFileEl($tr, state);
			this._lastChecked = $tr;
			this.updateSelectionSummary();
			if (this._detailsView && !this._detailsView.$el.hasClass('disappear')) {
				// hide sidebar
				this._updateDetailsView(null);
			}
		},

		/**
		 * Event handler for when selecting/deselecting all files
		 */
		_onClickSelectAll: function(e) {
			var checked = $(e.target).prop('checked');
			this.$fileList.find('td.selection>.selectCheckBox').prop('checked', checked)
				.closest('tr').toggleClass('selected', checked);
			this._selectedFiles = {};
			this._selectionSummary.clear();
			if (checked) {
				for (var i = 0; i < this.files.length; i++) {
					var fileData = this.files[i];
					this._selectedFiles[fileData.id] = fileData;
					this._selectionSummary.add(fileData);
				}
			}
			this.updateSelectionSummary();
			if (this._detailsView && !this._detailsView.$el.hasClass('disappear')) {
				// hide sidebar
				this._updateDetailsView(null);
			}
		},

		/**
		 * Event handler for when clicking on "Download" for the selected files
		 */
		_onClickDownloadSelected: function(event) {
			var files;
			var dir = this.getCurrentDirectory();
			if (this.isAllSelected() && this.getSelectedFiles().length > 1) {
				files = OC.basename(dir);
				dir = OC.dirname(dir) || '/';
			}
			else {
				files = _.pluck(this.getSelectedFiles(), 'name');
			}

			var downloadFileaction = $('#selectedActionsList').find('.download');

			// don't allow a second click on the download action
			if(downloadFileaction.hasClass('disabled')) {
				event.preventDefault();
				return;
			}

			var disableLoadingState = function(){
				OCA.Files.FileActions.updateFileActionSpinner(downloadFileaction, false);
			};

			OCA.Files.FileActions.updateFileActionSpinner(downloadFileaction, true);
			if(this.getSelectedFiles().length > 1) {
				OCA.Files.Files.handleDownload(this.getDownloadUrl(files, dir, true), disableLoadingState);
			}
			else {
				var first = this.getSelectedFiles()[0];
				OCA.Files.Files.handleDownload(this.getDownloadUrl(first.name, dir, true), disableLoadingState);
			}
			return false;
		},

		/**
		 * Event handler for when clicking on "Move" for the selected files
		 */
		_onClickCopyMoveSelected: function(event) {
			var files;
			var self = this;

			files = _.pluck(this.getSelectedFiles(), 'name');

			var moveFileAction = $('#selectedActionsList').find('.move');

			// don't allow a second click on the download action
			if(moveFileAction.hasClass('disabled')) {
				event.preventDefault();
				return;
			}

			var disableLoadingState = function(){
				OCA.Files.FileActions.updateFileActionSpinner(moveFileAction, false);
			};

			OC.dialogs.filepicker(t('files', 'Target folder'), function(targetPath, type) {
				if (type === OC.dialogs.FILEPICKER_TYPE_COPY) {
					self.copy(files, targetPath, disableLoadingState);
				}
				if (type === OC.dialogs.FILEPICKER_TYPE_MOVE) {
					self.move(files, targetPath, disableLoadingState);
				}
			}, false, "httpd/unix-directory", true, OC.dialogs.FILEPICKER_TYPE_COPY_MOVE);
			return false;
		},

		/**
		 * Event handler for when clicking on "Delete" for the selected files
		 */
		_onClickDeleteSelected: function(event) {
			var files = null;
			if (!this.isAllSelected()) {
				files = _.pluck(this.getSelectedFiles(), 'name');
			}
			this.do_delete(files);
			event.preventDefault();
			return false;
		},

		/**
		 * Event handler when clicking on a table header
		 */
		_onClickHeader: function(e) {
			if (this.$table.hasClass('multiselect')) {
				return;
			}
			var $target = $(e.target);
			var sort;
			if (!$target.is('a')) {
				$target = $target.closest('a');
			}
			sort = $target.attr('data-sort');
			if (sort && this._allowSorting) {
				if (this._sort === sort) {
					this.setSort(sort, (this._sortDirection === 'desc')?'asc':'desc', true, true);
				}
				else {
					if ( sort === 'name' ) {	//default sorting of name is opposite to size and mtime
						this.setSort(sort, 'asc', true, true);
					}
					else {
						this.setSort(sort, 'desc', true, true);
					}
				}
			}
		},

		/**
		 * Event handler when clicking on a bread crumb
		 */
		_onClickBreadCrumb: function(e) {
			// Select a crumb or a crumb in the menu
			var $el = $(e.target).closest('.crumb, .crumblist'),
				$targetDir = $el.data('dir');

			if ($targetDir !== undefined && e.which === 1) {
				e.preventDefault();
				this.changeDirectory($targetDir, true, true);
				this.updateSearch();
			}
		},

		/**
		 * Event handler for when scrolling the list container.
		 * This appends/renders the next page of entries when reaching the bottom.
		 */
		_onScroll: function(e) {
			if (this.$container.scrollTop() + this.$container.height() > this.$el.height() - 300) {
				this._nextPage(true);
			}
		},

		/**
		 * Event handler when dropping on a breadcrumb
		 */
		_onDropOnBreadCrumb: function( event, ui ) {
			var self = this;
			var $target = $(event.target);
			if (!$target.is('.crumb, .crumblist')) {
				$target = $target.closest('.crumb, .crumblist');
			}
			var targetPath = $(event.target).data('dir');
			var dir = this.getCurrentDirectory();
			while (dir.substr(0,1) === '/') {//remove extra leading /'s
				dir = dir.substr(1);
			}
			dir = '/' + dir;
			if (dir.substr(-1,1) !== '/') {
				dir = dir + '/';
			}
			// do nothing if dragged on current dir
			if (targetPath === dir || targetPath + '/' === dir) {
				return;
			}

			var files = this.getSelectedFiles();
			if (files.length === 0) {
				// single one selected without checkbox?
				files = _.map(ui.helper.find('tr'), function(el) {
					return self.elementToFile($(el));
				});
			}

			this.move(_.pluck(files, 'name'), targetPath);

			// re-enable td elements to be droppable
			// sometimes the filename drop handler is still called after re-enable,
			// it seems that waiting for a short time before re-enabling solves the problem
			setTimeout(function() {
				self.$el.find('td.filename.ui-droppable').droppable('enable');
			}, 10);
		},

		/**
		 * Sets a new page title
		 */
		setPageTitle: function(title){
			if (title) {
				title += ' - ';
			} else {
				title = '';
			}
			title += this.appName;
			// Sets the page title with the " - Nextcloud" suffix as in templates
			window.document.title = title + ' - ' + oc_defaults.title;

			return true;
		},
		/**
		 * Returns the file info for the given file name from the internal collection.
		 *
		 * @param {string} fileName file name
		 * @return {OCA.Files.FileInfo} file info or null if it was not found
		 *
		 * @since 8.2
		 */
		findFile: function(fileName) {
			return _.find(this.files, function(aFile) {
				return (aFile.name === fileName);
			}) || null;
		},
		/**
		 * Returns the tr element for a given file name, but only if it was already rendered.
		 *
		 * @param {string} fileName file name
		 * @return {Object} jQuery object of the matching row
		 */
		findFileEl: function(fileName){
			// use filterAttr to avoid escaping issues
			return this.$fileList.find('tr').filterAttr('data-file', fileName);
		},

		/**
		 * Returns the file data from a given file element.
		 * @param $el file tr element
		 * @return file data
		 */
		elementToFile: function($el){
			$el = $($el);
			var data = {
				id: parseInt($el.attr('data-id'), 10),
				name: $el.attr('data-file'),
				mimetype: $el.attr('data-mime'),
				mtime: parseInt($el.attr('data-mtime'), 10),
				type: $el.attr('data-type'),
				etag: $el.attr('data-etag'),
				permissions: parseInt($el.attr('data-permissions'), 10),
				hasPreview: $el.attr('data-has-preview') === 'true',
				isEncrypted: $el.attr('data-e2eencrypted') === 'true'
			};
			var size = $el.attr('data-size');
			if (size) {
				data.size = parseInt(size, 10);
			}
			var icon = $el.attr('data-icon');
			if (icon) {
				data.icon = icon;
			}
			var mountType = $el.attr('data-mounttype');
			if (mountType) {
				data.mountType = mountType;
			}
			var path = $el.attr('data-path');
			if (path) {
				data.path = path;
			}
			return data;
		},

		/**
		 * Appends the next page of files into the table
		 * @param animate true to animate the new elements
		 * @return array of DOM elements of the newly added files
		 */
		_nextPage: function(animate) {
			var index = this.$fileList.children().length,
				count = this.pageSize(),
				hidden,
				tr,
				fileData,
				newTrs = [],
				isAllSelected = this.isAllSelected(),
				showHidden = this._filesConfig.get('showhidden');

			if (index >= this.files.length) {
				return false;
			}

			while (count > 0 && index < this.files.length) {
				fileData = this.files[index];
				if (this._filter) {
					hidden = fileData.name.toLowerCase().indexOf(this._filter.toLowerCase()) === -1;
				} else {
					hidden = false;
				}
				tr = this._renderRow(fileData, {updateSummary: false, silent: true, hidden: hidden});
				this.$fileList.append(tr);
				if (isAllSelected || this._selectedFiles[fileData.id]) {
					tr.addClass('selected');
					tr.find('.selectCheckBox').prop('checked', true);
				}
				if (animate) {
					tr.addClass('appear transparent');
				}
				newTrs.push(tr);
				index++;
				// only count visible rows
				if (showHidden || !tr.hasClass('hidden-file')) {
					count--;
				}
			}

			// trigger event for newly added rows
			if (newTrs.length > 0) {
				this.$fileList.trigger($.Event('fileActionsReady', {fileList: this, $files: newTrs}));
			}

			if (animate) {
				// defer, for animation
				window.setTimeout(function() {
					for (var i = 0; i < newTrs.length; i++ ) {
						newTrs[i].removeClass('transparent');
					}
				}, 0);
			}

			return newTrs;
		},

		/**
		 * Event handler for when file actions were updated.
		 * This will refresh the file actions on the list.
		 */
		_onFileActionsUpdated: function() {
			var self = this;
			var $files = this.$fileList.find('tr');
			if (!$files.length) {
				return;
			}

			$files.each(function() {
				self.fileActions.display($(this).find('td.filename'), false, self);
			});
			this.$fileList.trigger($.Event('fileActionsReady', {fileList: this, $files: $files}));

		},

		/**
		 * Sets the files to be displayed in the list.
		 * This operation will re-render the list and update the summary.
		 * @param filesArray array of file data (map)
		 */
		setFiles: function(filesArray) {
			var self = this;

			// detach to make adding multiple rows faster
			this.files = filesArray;

			this.$fileList.empty();

			if (this._allowSelection) {
				// The results table, which has no selection column, checks
				// whether the main table has a selection column or not in order
				// to align its contents with those of the main table.
				this.$el.addClass('has-selection');
			}

			// clear "Select all" checkbox
			this.$el.find('.select-all').prop('checked', false);

			// Save full files list while rendering

			this.isEmpty = this.files.length === 0;
			this._nextPage();

			this.updateEmptyContent();

			this.fileSummary.calculate(this.files);

			this._selectedFiles = {};
			this._selectionSummary.clear();
			this.updateSelectionSummary();
			$(window).scrollTop(0);

			this.$fileList.trigger(jQuery.Event('updated'));
			_.defer(function() {
				self.$el.closest('#app-content').trigger(jQuery.Event('apprendered'));
			});
		},

		/**
		 * Returns whether the given file info must be hidden
		 *
		 * @param {OC.Files.FileInfo} fileInfo file info
		 *
		 * @return {boolean} true if the file is a hidden file, false otherwise
		 */
		_isHiddenFile: function(file) {
			return file.name && file.name.charAt(0) === '.';
		},

		/**
		 * Returns the icon URL matching the given file info
		 *
		 * @param {OC.Files.FileInfo} fileInfo file info
		 *
		 * @return {string} icon URL
		 */
		_getIconUrl: function(fileInfo) {
			var mimeType = fileInfo.mimetype || 'application/octet-stream';
			if (mimeType === 'httpd/unix-directory') {
				// use default folder icon
				if (fileInfo.mountType === 'shared' || fileInfo.mountType === 'shared-root') {
					return OC.MimeType.getIconUrl('dir-shared');
				} else if (fileInfo.mountType === 'external-root') {
					return OC.MimeType.getIconUrl('dir-external');
				} else if (fileInfo.mountType !== undefined && fileInfo.mountType !== '') {
					return OC.MimeType.getIconUrl('dir-' + fileInfo.mountType);
				}
				return OC.MimeType.getIconUrl('dir');
			}
			return OC.MimeType.getIconUrl(mimeType);
		},

		/**
		 * Creates a new table row element using the given file data.
		 * @param {OC.Files.FileInfo} fileData file info attributes
		 * @param options map of attributes
		 * @return new tr element (not appended to the table)
		 */
		_createRow: function(fileData, options) {
			var td, simpleSize, basename, extension, sizeColor,
				icon = fileData.icon || this._getIconUrl(fileData),
				name = fileData.name,
				// TODO: get rid of type, only use mime type
				type = fileData.type || 'file',
				mtime = parseInt(fileData.mtime, 10),
				mime = fileData.mimetype,
				path = fileData.path,
				dataIcon = null,
				linkUrl;
			options = options || {};

			if (isNaN(mtime)) {
				mtime = new Date().getTime();
			}

			if (type === 'dir') {
				mime = mime || 'httpd/unix-directory';

				if (fileData.isEncrypted) {
					icon = OC.MimeType.getIconUrl('dir-encrypted');
					dataIcon = icon;
				} else if (fileData.mountType && fileData.mountType.indexOf('external') === 0) {
					icon = OC.MimeType.getIconUrl('dir-external');
					dataIcon = icon;
				}
			}

			var permissions = fileData.permissions;
			if (permissions === undefined || permissions === null) {
				permissions = this.getDirectoryPermissions();
			}

			//containing tr
			var tr = $('<tr></tr>').attr({
				"data-id" : fileData.id,
				"data-type": type,
				"data-size": fileData.size,
				"data-file": name,
				"data-mime": mime,
				"data-mtime": mtime,
				"data-etag": fileData.etag,
				"data-permissions": permissions,
				"data-has-preview": fileData.hasPreview !== false,
				"data-e2eencrypted": fileData.isEncrypted === true
			});

			if (dataIcon) {
				// icon override
				tr.attr('data-icon', dataIcon);
			}

			if (fileData.mountType) {
				// dirInfo (parent) only exist for the "real" file list
				if (this.dirInfo.id) {
					// FIXME: HACK: detect shared-root
					if (fileData.mountType === 'shared' && this.dirInfo.mountType !== 'shared' && this.dirInfo.mountType !== 'shared-root') {
						// if parent folder isn't share, assume the displayed folder is a share root
						fileData.mountType = 'shared-root';
					} else if (fileData.mountType === 'external' && this.dirInfo.mountType !== 'external' && this.dirInfo.mountType !== 'external-root') {
						// if parent folder isn't external, assume the displayed folder is the external storage root
						fileData.mountType = 'external-root';
					}
				}
				tr.attr('data-mounttype', fileData.mountType);
			}

			if (!_.isUndefined(path)) {
				tr.attr('data-path', path);
			}
			else {
				path = this.getCurrentDirectory();
			}

			// selection td
			if (this._allowSelection) {
				td = $('<td class="selection"></td>');

				td.append(
					'<input id="select-' + this.id + '-' + fileData.id +
					'" type="checkbox" class="selectCheckBox checkbox"/><label for="select-' + this.id + '-' + fileData.id + '">' +
					'<span class="hidden-visually">' + t('files', 'Select') + '</span>' +
					'</label>'
				);

				tr.append(td);
			}

			// filename td
			td = $('<td class="filename"></td>');


			// linkUrl
			if (mime === 'httpd/unix-directory') {
				linkUrl = this.linkTo(path + '/' + name);
			}
			else {
				linkUrl = this.getDownloadUrl(name, path, type === 'dir');
			}
			var linkElem = $('<a></a>').attr({
				"class": "name",
				"href": linkUrl
			});

			linkElem.append('<div class="thumbnail-wrapper"><div class="thumbnail" style="background-image:url(' + icon + ');"></div></div>');

			// from here work on the display name
			name = fileData.displayName || name;

			// show hidden files (starting with a dot) completely in gray
			if(name.indexOf('.') === 0) {
				basename = '';
				extension = name;
			// split extension from filename for non dirs
			} else if (mime !== 'httpd/unix-directory' && name.indexOf('.') !== -1) {
				basename = name.substr(0, name.lastIndexOf('.'));
				extension = name.substr(name.lastIndexOf('.'));
			} else {
				basename = name;
				extension = false;
			}
			var nameSpan=$('<span></span>').addClass('nametext');
			var innernameSpan = $('<span></span>').addClass('innernametext').text(basename);


			var conflictingItems = this.$fileList.find('tr[data-file="' + this._jqSelEscape(name) + '"]');
			if (conflictingItems.length !== 0) {
				if (conflictingItems.length === 1) {
					// Update the path on the first conflicting item
					var $firstConflict = $(conflictingItems[0]),
						firstConflictPath = $firstConflict.attr('data-path') + '/';
					if (firstConflictPath.charAt(0) === '/') {
						firstConflictPath = firstConflictPath.substr(1);
					}
					if (firstConflictPath && firstConflictPath !== '/') {
						$firstConflict.find('td.filename span.innernametext').prepend($('<span></span>').addClass('conflict-path').text(firstConflictPath));
					}
				}

				var conflictPath = path + '/';
				if (conflictPath.charAt(0) === '/') {
					conflictPath = conflictPath.substr(1);
				}
				if (path && path !== '/') {
					nameSpan.append($('<span></span>').addClass('conflict-path').text(conflictPath));
				}
			}

			nameSpan.append(innernameSpan);
			linkElem.append(nameSpan);
			if (extension) {
				nameSpan.append($('<span></span>').addClass('extension').text(extension));
			}
			if (fileData.extraData) {
				if (fileData.extraData.charAt(0) === '/') {
					fileData.extraData = fileData.extraData.substr(1);
				}
				nameSpan.addClass('extra-data').attr('title', fileData.extraData);
				nameSpan.tooltip({placement: 'top'});
			}
			// dirs can show the number of uploaded files
			if (mime === 'httpd/unix-directory') {
				linkElem.append($('<span></span>').attr({
					'class': 'uploadtext',
					'currentUploads': 0
				}));
			}
			td.append(linkElem);
			tr.append(td);

			// size column
			if (typeof(fileData.size) !== 'undefined' && fileData.size >= 0) {
				simpleSize = humanFileSize(parseInt(fileData.size, 10), true);
				sizeColor = Math.round(160-Math.pow((fileData.size/(1024*1024)),2));
			} else {
				simpleSize = t('files', 'Pending');
			}

			td = $('<td></td>').attr({
				"class": "filesize",
				"style": 'color:rgb(' + sizeColor + ',' + sizeColor + ',' + sizeColor + ')'
			}).text(simpleSize);
			tr.append(td);

			// date column (1000 milliseconds to seconds, 60 seconds, 60 minutes, 24 hours)
			// difference in days multiplied by 5 - brightest shade for files older than 32 days (160/5)
			var modifiedColor = Math.round(((new Date()).getTime() - mtime )/1000/60/60/24*5 );
			// ensure that the brightest color is still readable
			if (modifiedColor >= '160') {
				modifiedColor = 160;
			}
			var formatted;
			var text;
			if (mtime > 0) {
				formatted = OC.Util.formatDate(mtime);
				text = OC.Util.relativeModifiedDate(mtime);
			} else {
				formatted = t('files', 'Unable to determine date');
				text = '?';
			}
			td = $('<td></td>').attr({ "class": "date" });
			td.append($('<span></span>').attr({
				"class": "modified live-relative-timestamp",
				"title": formatted,
				"data-timestamp": mtime,
				"style": 'color:rgb('+modifiedColor+','+modifiedColor+','+modifiedColor+')'
			}).text(text)
			  .tooltip({placement: 'top'})
			);
			tr.find('.filesize').text(simpleSize);
			tr.append(td);
			return tr;
		},

		/* escape a selector expression for jQuery */
		_jqSelEscape: function (expression) {
			if (expression) {
				return expression.replace(/[!"#$%&'()*+,.\/:;<=>?@\[\\\]^`{|}~]/g, '\\$&');
			}
			return null;
		},

		/**
		 * Adds an entry to the files array and also into the DOM
		 * in a sorted manner.
		 *
		 * @param {OC.Files.FileInfo} fileData map of file attributes
		 * @param {Object} [options] map of attributes
		 * @param {boolean} [options.updateSummary] true to update the summary
		 * after adding (default), false otherwise. Defaults to true.
		 * @param {boolean} [options.silent] true to prevent firing events like "fileActionsReady",
		 * defaults to false.
		 * @param {boolean} [options.animate] true to animate the thumbnail image after load
		 * defaults to true.
		 * @return new tr element (not appended to the table)
		 */
		add: function(fileData, options) {
			var index;
			var $tr;
			var $rows;
			var $insertionPoint;
			options = _.extend({animate: true}, options || {});

			// there are three situations to cover:
			// 1) insertion point is visible on the current page
			// 2) insertion point is on a not visible page (visible after scrolling)
			// 3) insertion point is at the end of the list

			$rows = this.$fileList.children();
			index = this._findInsertionIndex(fileData);
			if (index > this.files.length) {
				index = this.files.length;
			}
			else {
				$insertionPoint = $rows.eq(index);
			}

			// is the insertion point visible ?
			if ($insertionPoint.length) {
				// only render if it will really be inserted
				$tr = this._renderRow(fileData, options);
				$insertionPoint.before($tr);
			}
			else {
				// if insertion point is after the last visible
				// entry, append
				if (index === $rows.length) {
					$tr = this._renderRow(fileData, options);
					this.$fileList.append($tr);
				}
			}

			this.isEmpty = false;
			this.files.splice(index, 0, fileData);

			if ($tr && options.animate) {
				$tr.addClass('appear transparent');
				window.setTimeout(function() {
					$tr.removeClass('transparent');
				});
			}

			if (options.scrollTo) {
				this.scrollTo(fileData.name);
			}

			// defaults to true if not defined
			if (typeof(options.updateSummary) === 'undefined' || !!options.updateSummary) {
				this.fileSummary.add(fileData, true);
				this.updateEmptyContent();
			}

			return $tr;
		},

		/**
		 * Creates a new row element based on the given attributes
		 * and returns it.
		 *
		 * @param {OC.Files.FileInfo} fileData map of file attributes
		 * @param {Object} [options] map of attributes
		 * @param {int} [options.index] index at which to insert the element
		 * @param {boolean} [options.updateSummary] true to update the summary
		 * after adding (default), false otherwise. Defaults to true.
		 * @param {boolean} [options.animate] true to animate the thumbnail image after load
		 * defaults to true.
		 * @return new tr element (not appended to the table)
		 */
		_renderRow: function(fileData, options) {
			options = options || {};
			var type = fileData.type || 'file',
				mime = fileData.mimetype,
				path = fileData.path || this.getCurrentDirectory(),
				permissions = parseInt(fileData.permissions, 10) || 0;

			var isEndToEndEncrypted = (type === 'dir' && fileData.isEncrypted);

			if (!isEndToEndEncrypted && fileData.isShareMountPoint) {
				permissions = permissions | OC.PERMISSION_UPDATE;
			}

			if (type === 'dir') {
				mime = mime || 'httpd/unix-directory';
			}
			var tr = this._createRow(
				fileData,
				options
			);
			var filenameTd = tr.find('td.filename');

			// TODO: move dragging to FileActions ?
			// enable drag only for deletable files
			if (this._dragOptions && permissions & OC.PERMISSION_DELETE) {
				filenameTd.draggable(this._dragOptions);
			}
			// allow dropping on folders
			if (this._folderDropOptions && mime === 'httpd/unix-directory') {
				tr.droppable(this._folderDropOptions);
			}

			if (options.hidden) {
				tr.addClass('hidden');
			}

			if (this._isHiddenFile(fileData)) {
				tr.addClass('hidden-file');
			}

			// display actions
			this.fileActions.display(filenameTd, !options.silent, this);

			if (mime !== 'httpd/unix-directory' && fileData.hasPreview !== false) {
				var iconDiv = filenameTd.find('.thumbnail');
				// lazy load / newly inserted td ?
				// the typeof check ensures that the default value of animate is true
				if (typeof(options.animate) === 'undefined' || !!options.animate) {
					this.lazyLoadPreview({
						path: path + '/' + fileData.name,
						mime: mime,
						etag: fileData.etag,
						callback: function(url) {
							iconDiv.css('background-image', 'url("' + url + '")');
						}
					});
				}
				else {
					// set the preview URL directly
					var urlSpec = {
							file: path + '/' + fileData.name,
							c: fileData.etag
						};
					var previewUrl = this.generatePreviewUrl(urlSpec);
					previewUrl = previewUrl.replace('(', '%28').replace(')', '%29');
					iconDiv.css('background-image', 'url("' + previewUrl + '")');
				}
			}
			return tr;
		},
		/**
		 * Returns the current directory
		 * @method getCurrentDirectory
		 * @return current directory
		 */
		getCurrentDirectory: function(){
			return this._currentDirectory || this.$el.find('#dir').val() || '/';
		},
		/**
		 * Returns the directory permissions
		 * @return permission value as integer
		 */
		getDirectoryPermissions: function() {
			return parseInt(this.$el.find('#permissions').val(), 10);
		},
		/**
		 * Changes the current directory and reload the file list.
		 * @param {string} targetDir target directory (non URL encoded)
		 * @param {boolean} [changeUrl=true] if the URL must not be changed (defaults to true)
		 * @param {boolean} [force=false] set to true to force changing directory
		 * @param {string} [fileId] optional file id, if known, to be appended in the URL
		 */
		changeDirectory: function(targetDir, changeUrl, force, fileId) {
			var self = this;
			var currentDir = this.getCurrentDirectory();
			targetDir = targetDir || '/';
			if (!force && currentDir === targetDir) {
				return;
			}
			this._setCurrentDir(targetDir, changeUrl, fileId);

			// discard finished uploads list, we'll get it through a regular reload
			this._uploads = {};
			this.reload().then(function(success){
				if (!success) {
					self.changeDirectory(currentDir, true);
				}
			});
		},
		linkTo: function(dir) {
			return OC.linkTo('files', 'index.php')+"?dir="+ encodeURIComponent(dir).replace(/%2F/g, '/');
		},

		/**
		 * @param {string} path
		 * @returns {boolean}
		 */
		_isValidPath: function(path) {
			var sections = path.split('/');
			for (var i = 0; i < sections.length; i++) {
				if (sections[i] === '..') {
					return false;
				}
			}

			return path.toLowerCase().indexOf(decodeURI('%0a')) === -1 &&
				path.toLowerCase().indexOf(decodeURI('%00')) === -1;
		},

		/**
		 * Sets the current directory name and updates the breadcrumb.
		 * @param targetDir directory to display
		 * @param changeUrl true to also update the URL, false otherwise (default)
		 * @param {string} [fileId] file id
		 */
		_setCurrentDir: function(targetDir, changeUrl, fileId) {
			targetDir = targetDir.replace(/\\/g, '/');
			if (!this._isValidPath(targetDir)) {
				targetDir = '/';
				changeUrl = true;
			}
			var previousDir = this.getCurrentDirectory(),
				baseDir = OC.basename(targetDir);

			if (baseDir !== '') {
				this.setPageTitle(baseDir);
			}
			else {
				this.setPageTitle();
			}

			if (targetDir.length > 0 && targetDir[0] !== '/') {
				targetDir = '/' + targetDir;
			}
			this._currentDirectory = targetDir;

			// legacy stuff
			this.$el.find('#dir').val(targetDir);

			if (changeUrl !== false) {
				var params = {
					dir: targetDir,
					previousDir: previousDir
				};
				if (fileId) {
					params.fileId = fileId;
				}
				this.$el.trigger(jQuery.Event('changeDirectory', params));
			}
			this.breadcrumb.setDirectory(this.getCurrentDirectory());
		},
		/**
		 * Sets the current sorting and refreshes the list
		 *
		 * @param sort sort attribute name
		 * @param direction sort direction, one of "asc" or "desc"
		 * @param update true to update the list, false otherwise (default)
		 * @param persist true to save changes in the database (default)
		 */
		setSort: function(sort, direction, update, persist) {
			var comparator = FileList.Comparators[sort] || FileList.Comparators.name;
			this._sort = sort;
			this._sortDirection = (direction === 'desc')?'desc':'asc';
			this._sortComparator = function(fileInfo1, fileInfo2) {
				var isFavorite = function(fileInfo) {
					return fileInfo.tags && fileInfo.tags.indexOf(OC.TAG_FAVORITE) >= 0;
				};

				if (isFavorite(fileInfo1) && !isFavorite(fileInfo2)) {
					return -1;
				} else if (!isFavorite(fileInfo1) && isFavorite(fileInfo2)) {
					return 1;
				}

				return direction === 'asc' ? comparator(fileInfo1, fileInfo2) : -comparator(fileInfo1, fileInfo2);
			};

			this.$el.find('thead th .sort-indicator')
				.removeClass(this.SORT_INDICATOR_ASC_CLASS)
				.removeClass(this.SORT_INDICATOR_DESC_CLASS)
				.toggleClass('hidden', true)
				.addClass(this.SORT_INDICATOR_DESC_CLASS);

			this.$el.find('thead th.column-' + sort + ' .sort-indicator')
				.removeClass(this.SORT_INDICATOR_ASC_CLASS)
				.removeClass(this.SORT_INDICATOR_DESC_CLASS)
				.toggleClass('hidden', false)
				.addClass(direction === 'desc' ? this.SORT_INDICATOR_DESC_CLASS : this.SORT_INDICATOR_ASC_CLASS);
			if (update) {
				if (this._clientSideSort) {
					this.files.sort(this._sortComparator);
					this.setFiles(this.files);
				}
				else {
					this.reload();
				}
			}

			if (persist) {
				$.post(OC.generateUrl('/apps/files/api/v1/sorting'), {
					mode: sort,
					direction: direction
				});
			}
		},

		/**
		 * Returns list of webdav properties to request
		 */
		_getWebdavProperties: function() {
			return [].concat(this.filesClient.getPropfindProperties());
		},

		/**
		 * Reloads the file list using ajax call
		 *
		 * @return ajax call object
		 */
		reload: function() {
			this._selectedFiles = {};
			this._selectionSummary.clear();
			if (this._currentFileModel) {
				this._currentFileModel.off();
			}
			this._currentFileModel = null;
			this.$el.find('.select-all').prop('checked', false);
			this.showMask();
			this._reloadCall = this.filesClient.getFolderContents(
				this.getCurrentDirectory(), {
					includeParent: true,
					properties: this._getWebdavProperties()
				}
			);
			if (this._detailsView) {
				// close sidebar
				this._updateDetailsView(null);
			}
			this._setCurrentDir(this.getCurrentDirectory(), false);
			var callBack = this.reloadCallback.bind(this);
			return this._reloadCall.then(callBack, callBack);
		},
		reloadCallback: function(status, result) {
			delete this._reloadCall;
			this.hideMask();

			if (status === 401) {
				return false;
			}

			// Firewall Blocked request?
			if (status === 403) {
				// Go home
				this.changeDirectory('/');
				OC.Notification.show(t('files', 'This operation is forbidden'), {type: 'error'});
				return false;
			}

			// Did share service die or something else fail?
			if (status === 500) {
				// Go home
				this.changeDirectory('/');
				OC.Notification.show(t('files', 'This directory is unavailable, please check the logs or contact the administrator'),
					{type: 'error'}
				);
				return false;
			}

			if (status === 503) {
				// Go home
				if (this.getCurrentDirectory() !== '/') {
					this.changeDirectory('/');
					// TODO: read error message from exception
					OC.Notification.show(t('files', 'Storage is temporarily not available'),
						{type: 'error'}
					);
				}
				return false;
			}

			if (status === 400 || status === 404 || status === 405) {
				// go back home
				this.changeDirectory('/');
				return false;
			}
			// aborted ?
			if (status === 0){
				return true;
			}

			this.updateStorageStatistics(true);

			// first entry is the root
			this.dirInfo = result.shift();
			this.breadcrumb.setDirectoryInfo(this.dirInfo);

			if (this.dirInfo.permissions) {
				this.setDirectoryPermissions(this.dirInfo.permissions);
			}

			result.sort(this._sortComparator);
			this.setFiles(result);

			if (this.dirInfo) {
				var newFileId = this.dirInfo.id;
				// update fileid in URL
				var params = {
					dir: this.getCurrentDirectory()
				};
				if (newFileId) {
					params.fileId = newFileId;
				}
				this.$el.trigger(jQuery.Event('afterChangeDirectory', params));
			}
			return true;
		},

		updateStorageStatistics: function(force) {
			OCA.Files.Files.updateStorageStatistics(this.getCurrentDirectory(), force);
		},

		updateStorageQuotas: function() {
			OCA.Files.Files.updateStorageQuotas();
		},

		/**
		 * @deprecated do not use nor override
		 */
		getAjaxUrl: function(action, params) {
			return OCA.Files.Files.getAjaxUrl(action, params);
		},

		getDownloadUrl: function(files, dir, isDir) {
			return OCA.Files.Files.getDownloadUrl(files, dir || this.getCurrentDirectory(), isDir);
		},

		getUploadUrl: function(fileName, dir) {
			if (_.isUndefined(dir)) {
				dir = this.getCurrentDirectory();
			}

			var pathSections = dir.split('/');
			if (!_.isUndefined(fileName)) {
				pathSections.push(fileName);
			}
			var encodedPath = '';
			_.each(pathSections, function(section) {
				if (section !== '') {
					encodedPath += '/' + encodeURIComponent(section);
				}
			});
			return OC.linkToRemoteBase('webdav') + encodedPath;
		},

		/**
		 * Generates a preview URL based on the URL space.
		 * @param urlSpec attributes for the URL
		 * @param {int} urlSpec.x width
		 * @param {int} urlSpec.y height
		 * @param {String} urlSpec.file path to the file
		 * @return preview URL
		 */
		generatePreviewUrl: function(urlSpec) {
			urlSpec = urlSpec || {};
			if (!urlSpec.x) {
				urlSpec.x = this.$table.data('preview-x') || 32;
			}
			if (!urlSpec.y) {
				urlSpec.y = this.$table.data('preview-y') || 32;
			}
			urlSpec.x *= window.devicePixelRatio;
			urlSpec.y *= window.devicePixelRatio;
			urlSpec.x = Math.ceil(urlSpec.x);
			urlSpec.y = Math.ceil(urlSpec.y);
			urlSpec.forceIcon = 0;
			return OC.generateUrl('/core/preview.png?') + $.param(urlSpec);
		},

		/**
		 * Lazy load a file's preview.
		 *
		 * @param path path of the file
		 * @param mime mime type
		 * @param callback callback function to call when the image was loaded
		 * @param etag file etag (for caching)
		 */
		lazyLoadPreview : function(options) {
			var self = this;
			var path = options.path;
			var mime = options.mime;
			var ready = options.callback;
			var etag = options.etag;

			// get mime icon url
			var iconURL = OC.MimeType.getIconUrl(mime);
			var previewURL,
				urlSpec = {};
			ready(iconURL); // set mimeicon URL

			urlSpec.file = OCA.Files.Files.fixPath(path);
			if (options.x) {
				urlSpec.x = options.x;
			}
			if (options.y) {
				urlSpec.y = options.y;
			}
			if (options.a) {
				urlSpec.a = options.a;
			}
			if (options.mode) {
				urlSpec.mode = options.mode;
			}

			if (etag){
				// use etag as cache buster
				urlSpec.c = etag;
			}

			previewURL = self.generatePreviewUrl(urlSpec);
			previewURL = previewURL.replace('(', '%28');
			previewURL = previewURL.replace(')', '%29');

			// preload image to prevent delay
			// this will make the browser cache the image
			var img = new Image();
			img.onload = function(){
				// if loading the preview image failed (no preview for the mimetype) then img.width will < 5
				if (img.width > 5) {
					ready(previewURL, img);
				} else if (options.error) {
					options.error();
				}
			};
			if (options.error) {
				img.onerror = options.error;
			}
			img.src = previewURL;
		},

		/**
		 * @deprecated
		 */
		setDirectoryPermissions: function(permissions) {
			var isCreatable = (permissions & OC.PERMISSION_CREATE) !== 0;
			this.$el.find('#permissions').val(permissions);
			this.$el.find('.creatable').toggleClass('hidden', !isCreatable);
			this.$el.find('.notCreatable').toggleClass('hidden', isCreatable);
		},
		/**
		 * Shows/hides action buttons
		 *
		 * @param show true for enabling, false for disabling
		 */
		showActions: function(show){
			this.$el.find('.actions,#file_action_panel').toggleClass('hidden', !show);
			if (show){
				// make sure to display according to permissions
				var permissions = this.getDirectoryPermissions();
				var isCreatable = (permissions & OC.PERMISSION_CREATE) !== 0;
				this.$el.find('.creatable').toggleClass('hidden', !isCreatable);
				this.$el.find('.notCreatable').toggleClass('hidden', isCreatable);
				// remove old style breadcrumbs (some apps might create them)
				this.$el.find('#controls .crumb').remove();
				// refresh breadcrumbs in case it was replaced by an app
				this.breadcrumb.render();
			}
			else{
				this.$el.find('.creatable, .notCreatable').addClass('hidden');
			}
		},
		/**
		 * Enables/disables viewer mode.
		 * In viewer mode, apps can embed themselves under the controls bar.
		 * In viewer mode, the actions of the file list will be hidden.
		 * @param show true for enabling, false for disabling
		 */
		setViewerMode: function(show){
			this.showActions(!show);
			this.$el.find('#filestable').toggleClass('hidden', show);
			this.$el.trigger(new $.Event('changeViewerMode', {viewerModeEnabled: show}));
		},
		/**
		 * Removes a file entry from the list
		 * @param name name of the file to remove
		 * @param {Object} [options] map of attributes
		 * @param {boolean} [options.updateSummary] true to update the summary
		 * after removing, false otherwise. Defaults to true.
		 * @return deleted element
		 */
		remove: function(name, options){
			options = options || {};
			var fileEl = this.findFileEl(name);
			var fileId = fileEl.data('id');
			var index = fileEl.index();
			if (!fileEl.length) {
				return null;
			}
			if (this._selectedFiles[fileId]) {
				// remove from selection first
				this._selectFileEl(fileEl, false);
				this.updateSelectionSummary();
			}
			if (this._dragOptions && (fileEl.data('permissions') & OC.PERMISSION_DELETE)) {
				// file is only draggable when delete permissions are set
				fileEl.find('td.filename').draggable('destroy');
			}
			this.files.splice(index, 1);
			if (this._currentFileModel && this._currentFileModel.get('id') === fileId) {
				// Note: in the future we should call destroy() directly on the model
				// and the model will take care of the deletion.
				// Here we only trigger the event to notify listeners that
				// the file was removed.
				this._currentFileModel.trigger('destroy');
				this._updateDetailsView(null);
			}
			fileEl.remove();
			// TODO: improve performance on batch update
			this.isEmpty = !this.files.length;
			if (typeof(options.updateSummary) === 'undefined' || !!options.updateSummary) {
				this.updateEmptyContent();
				this.fileSummary.remove({type: fileEl.attr('data-type'), size: fileEl.attr('data-size')}, true);
			}

			var lastIndex = this.$fileList.children().length;
			// if there are less elements visible than one page
			// but there are still pending elements in the array,
			// then directly append the next page
			if (lastIndex < this.files.length && lastIndex < this.pageSize()) {
				this._nextPage(true);
			}

			return fileEl;
		},
		/**
		 * Finds the index of the row before which the given
		 * fileData should be inserted, considering the current
		 * sorting
		 *
		 * @param {OC.Files.FileInfo} fileData file info
		 */
		_findInsertionIndex: function(fileData) {
			var index = 0;
			while (index < this.files.length && this._sortComparator(fileData, this.files[index]) > 0) {
				index++;
			}
			return index;
		},

		/**
		 * Moves a file to a given target folder.
		 *
		 * @param fileNames array of file names to move
		 * @param targetPath absolute target path
		 * @param callback function to call when movement is finished
		 */
		move: function(fileNames, targetPath, callback) {
			var self = this;
			var dir = this.getCurrentDirectory();
			if (dir.charAt(dir.length - 1) !== '/') {
				dir += '/';
			}
			var target = OC.basename(targetPath);
			if (!_.isArray(fileNames)) {
				fileNames = [fileNames];
			}
			_.each(fileNames, function(fileName) {
				var $tr = self.findFileEl(fileName);
				self.showFileBusyState($tr, true);
				if (targetPath.charAt(targetPath.length - 1) !== '/') {
					// make sure we move the files into the target dir,
					// not overwrite it
					targetPath = targetPath + '/';
				}
				self.filesClient.move(dir + fileName, targetPath + fileName)
					.done(function() {
						// if still viewing the same directory
						if (OC.joinPaths(self.getCurrentDirectory(), '/') === dir) {
							// recalculate folder size
							var oldFile = self.findFileEl(target);
							var newFile = self.findFileEl(fileName);
							var oldSize = oldFile.data('size');
							var newSize = oldSize + newFile.data('size');
							oldFile.data('size', newSize);
							oldFile.find('td.filesize').text(OC.Util.humanFileSize(newSize));

							// TODO: also update entry in FileList.files
							self.remove(fileName);
						}
					})
					.fail(function(status) {
						if (status === 412) {
							// TODO: some day here we should invoke the conflict dialog
							OC.Notification.show(t('files', 'Could not move "{file}", target exists',
								{file: fileName}), {type: 'error'}
							);
						} else {
							OC.Notification.show(t('files', 'Could not move "{file}"',
								{file: fileName}), {type: 'error'}
							);
						}
					})
					.always(function() {
						self.showFileBusyState($tr, false);
					});
				if (callback) {
					callback();
				}
			});

		},

		/**
		 * Copies a file to a given target folder.
		 *
		 * @param fileNames array of file names to copy
		 * @param targetPath absolute target path
		 * @param callback to call when copy is finished with success
		 */
		copy: function(fileNames, targetPath, callback) {
			var self = this;
			var filesToNotify = [];
			var count = 0;

			var dir = this.getCurrentDirectory();
			if (dir.charAt(dir.length - 1) !== '/') {
				dir += '/';
			}
			var target = OC.basename(targetPath);
			if (!_.isArray(fileNames)) {
				fileNames = [fileNames];
			}
			_.each(fileNames, function(fileName) {
				var $tr = self.findFileEl(fileName);
				self.showFileBusyState($tr, true);
				if (targetPath.charAt(targetPath.length - 1) !== '/') {
					// make sure we move the files into the target dir,
					// not overwrite it
					targetPath = targetPath + '/';
				}
				self.filesClient.copy(dir + fileName, targetPath + fileName)
					.done(function () {
						filesToNotify.push(fileName);

						// if still viewing the same directory
						if (OC.joinPaths(self.getCurrentDirectory(), '/') === dir) {
							// recalculate folder size
							var oldFile = self.findFileEl(target);
							var newFile = self.findFileEl(fileName);
							var oldSize = oldFile.data('size');
							var newSize = oldSize + newFile.data('size');
							oldFile.data('size', newSize);
							oldFile.find('td.filesize').text(OC.Util.humanFileSize(newSize));
						}
					})
					.fail(function(status) {
						if (status === 412) {
							// TODO: some day here we should invoke the conflict dialog
							OC.Notification.show(t('files', 'Could not copy "{file}", target exists',
								{file: fileName}), {type: 'error'}
							);
						} else {
							OC.Notification.show(t('files', 'Could not copy "{file}"',
								{file: fileName}), {type: 'error'}
							);
						}
					})
					.always(function() {
						self.showFileBusyState($tr, false);
						count++;

						/**
						 * We only show the notifications once the last file has been copied
						 */
						if (count === fileNames.length) {
							// Remove leading and ending /
							if (targetPath.slice(0, 1) === '/') {
								targetPath = targetPath.slice(1, targetPath.length);
							}
							if (targetPath.slice(-1) === '/') {
								targetPath = targetPath.slice(0, -1);
							}

							if (filesToNotify.length > 0) {
								// Since there's no visual indication that the files were copied, let's send some notifications !
								if (filesToNotify.length === 1) {
									OC.Notification.show(t('files', 'Copied {origin} inside {destination}',
										{
											origin: filesToNotify[0],
											destination: targetPath
										}
									), {timeout: 10});
								} else if (filesToNotify.length > 0 && filesToNotify.length < 3) {
									OC.Notification.show(t('files', 'Copied {origin} inside {destination}',
										{
											origin: filesToNotify.join(', '),
											destination: targetPath
										}
									), {timeout: 10});
								} else {
									OC.Notification.show(t('files', 'Copied {origin} and {nbfiles} other files inside {destination}',
										{
											origin: filesToNotify[0],
											nbfiles: filesToNotify.length - 1,
											destination: targetPath
										}
									), {timeout: 10});
								}
							}
						}
					});
			});

			if (callback) {
				callback();
			}
		},

		/**
		 * Updates the given row with the given file info
		 *
		 * @param {Object} $tr row element
		 * @param {OCA.Files.FileInfo} fileInfo file info
		 * @param {Object} options options
		 *
		 * @return {Object} new row element
		 */
		updateRow: function($tr, fileInfo, options) {
			this.files.splice($tr.index(), 1);
			$tr.remove();
			options = _.extend({silent: true}, options);
			options = _.extend(options, {updateSummary: false});
			$tr = this.add(fileInfo, options);
			this.$fileList.trigger($.Event('fileActionsReady', {fileList: this, $files: $tr}));
			return $tr;
		},

		/**
		 * Triggers file rename input field for the given file name.
		 * If the user enters a new name, the file will be renamed.
		 *
		 * @param oldName file name of the file to rename
		 */
		rename: function(oldName) {
			var self = this;
			var tr, td, input, form;
			tr = this.findFileEl(oldName);
			var oldFileInfo = this.files[tr.index()];
			tr.data('renaming',true);
			td = tr.children('td.filename');
			input = $('<input type="text" class="filename"/>').val(oldName);
			form = $('<form></form>');
			form.append(input);
			td.children('a.name').hide();
			td.append(form);
			input.focus();
			//preselect input
			var len = input.val().lastIndexOf('.');
			if ( len === -1 ||
				tr.data('type') === 'dir' ) {
				len = input.val().length;
			}
			input.selectRange(0, len);
			var checkInput = function () {
				var filename = input.val();
				if (filename !== oldName) {
					// Files.isFileNameValid(filename) throws an exception itself
					OCA.Files.Files.isFileNameValid(filename);
					if (self.inList(filename)) {
						throw t('files', '{newName} already exists', {newName: filename}, undefined, {
							escape: false
						});
					}
				}
				return true;
			};

			function restore() {
				input.tooltip('hide');
				tr.data('renaming',false);
				form.remove();
				td.children('a.name').show();
			}

			function updateInList(fileInfo) {
				self.updateRow(tr, fileInfo);
				self._updateDetailsView(fileInfo.name, false);
			}

			// TODO: too many nested blocks, move parts into functions
			form.submit(function(event) {
				event.stopPropagation();
				event.preventDefault();
				if (input.hasClass('error')) {
					return;
				}

				try {
					var newName = input.val();
					input.tooltip('hide');
					form.remove();

					if (newName !== oldName) {
						checkInput();
						// mark as loading (temp element)
						self.showFileBusyState(tr, true);
						tr.attr('data-file', newName);
						var basename = newName;
						if (newName.indexOf('.') > 0 && tr.data('type') !== 'dir') {
							basename = newName.substr(0, newName.lastIndexOf('.'));
						}
						td.find('a.name span.nametext').text(basename);
						td.children('a.name').show();

						var path = tr.attr('data-path') || self.getCurrentDirectory();
						self.filesClient.move(OC.joinPaths(path, oldName), OC.joinPaths(path, newName))
							.done(function() {
								oldFileInfo.name = newName;
								updateInList(oldFileInfo);
							})
							.fail(function(status) {
								// TODO: 409 means current folder does not exist, redirect ?
								if (status === 404) {
									// source not found, so remove it from the list
									OC.Notification.show(t('files', 'Could not rename "{fileName}", it does not exist any more',
										{fileName: oldName}), {timeout: 7, type: 'error'}
									);

									self.remove(newName, {updateSummary: true});
									return;
								} else if (status === 412) {
									// target exists
									OC.Notification.show(
										t('files', 'The name "{targetName}" is already used in the folder "{dir}". Please choose a different name.',
										{
											targetName: newName,
											dir: self.getCurrentDirectory(),
										}),
										{
											type: 'error'
										}
									);
								} else {
									// restore the item to its previous state
									OC.Notification.show(t('files', 'Could not rename "{fileName}"',
										{fileName: oldName}), {type: 'error'}
									);
								}
								updateInList(oldFileInfo);
							});
					} else {
						// add back the old file info when cancelled
						self.files.splice(tr.index(), 1);
						tr.remove();
						tr = self.add(oldFileInfo, {updateSummary: false, silent: true});
						self.$fileList.trigger($.Event('fileActionsReady', {fileList: self, $files: $(tr)}));
					}
				} catch (error) {
					input.attr('title', error);
					input.tooltip({placement: 'right', trigger: 'manual'});
					input.tooltip('fixTitle');
					input.tooltip('show');
					input.addClass('error');
				}
				return false;
			});
			input.keyup(function(event) {
				// verify filename on typing
				try {
					checkInput();
					input.tooltip('hide');
					input.removeClass('error');
				} catch (error) {
					input.attr('title', error);
					input.tooltip({placement: 'right', trigger: 'manual'});
					input.tooltip('fixTitle');
					input.tooltip('show');
					input.addClass('error');
				}
				if (event.keyCode === 27) {
					restore();
				}
			});
			input.click(function(event) {
				event.stopPropagation();
				event.preventDefault();
			});
			input.blur(function() {
				form.trigger('submit');
			});
		},

		/**
		 * Create an empty file inside the current directory.
		 *
		 * @param {string} name name of the file
		 *
		 * @return {Promise} promise that will be resolved after the
		 * file was created
		 *
		 * @since 8.2
		 */
		createFile: function(name) {
			var self = this;
			var deferred = $.Deferred();
			var promise = deferred.promise();

			OCA.Files.Files.isFileNameValid(name);

			if (this.lastAction) {
				this.lastAction();
			}

			name = this.getUniqueName(name);
			var targetPath = this.getCurrentDirectory() + '/' + name;

			self.filesClient.putFileContents(
					targetPath,
					' ', // dont create empty files which fails on some storage backends
					{
						contentType: 'text/plain',
						overwrite: true
					}
				)
				.done(function() {
					// TODO: error handling / conflicts
					self.addAndFetchFileInfo(targetPath, '', {scrollTo: true}).then(function(status, data) {
						deferred.resolve(status, data);
					}, function() {
						OC.Notification.show(t('files', 'Could not create file "{file}"',
							{file: name}), {type: 'error'}
						);
					});
				})
				.fail(function(status) {
					if (status === 412) {
						OC.Notification.show(t('files', 'Could not create file "{file}" because it already exists',
							{file: name}), {type: 'error'}
						);
					} else {
						OC.Notification.show(t('files', 'Could not create file "{file}"',
							{file: name}), {type: 'error'}
						);
					}
					deferred.reject(status);
				});

			return promise;
		},

		/**
		 * Create a directory inside the current directory.
		 *
		 * @param {string} name name of the directory
		 *
		 * @return {Promise} promise that will be resolved after the
		 * directory was created
		 *
		 * @since 8.2
		 */
		createDirectory: function(name) {
			var self = this;
			var deferred = $.Deferred();
			var promise = deferred.promise();

			OCA.Files.Files.isFileNameValid(name);

			if (this.lastAction) {
				this.lastAction();
			}

			name = this.getUniqueName(name);
			var targetPath = this.getCurrentDirectory() + '/' + name;

			this.filesClient.createDirectory(targetPath)
				.done(function() {
					self.addAndFetchFileInfo(targetPath, '', {scrollTo:true}).then(function(status, data) {
						deferred.resolve(status, data);
					}, function() {
						OC.Notification.show(t('files', 'Could not create folder "{dir}"',
							{dir: name}), {type: 'error'}
						);
					});
				})
				.fail(function(createStatus) {
					// method not allowed, folder might exist already
					if (createStatus === 405) {
						// add it to the list, for completeness
						self.addAndFetchFileInfo(targetPath, '', {scrollTo:true})
							.done(function(status, data) {
								OC.Notification.show(t('files', 'Could not create folder "{dir}" because it already exists',
									{dir: name}), {type: 'error'}
								);
								// still consider a failure
								deferred.reject(createStatus, data);
							})
							.fail(function() {
								OC.Notification.show(t('files', 'Could not create folder "{dir}"',
									{dir: name}), {type: 'error'}
								);
								deferred.reject(status);
							});
					} else {
						OC.Notification.show(t('files', 'Could not create folder "{dir}"',
							{dir: name}), {type: 'error'}
						);
						deferred.reject(createStatus);
					}
				});

			return promise;
		},

		/**
		 * Add file into the list by fetching its information from the server first.
		 *
		 * If the given directory does not match the current directory, nothing will
		 * be fetched.
		 *
		 * @param {String} fileName file name
		 * @param {String} [dir] optional directory, defaults to the current one
		 * @param {Object} options same options as #add
		 * @return {Promise} promise that resolves with the file info, or an
		 * already resolved Promise if no info was fetched. The promise rejects
		 * if the file was not found or an error occurred.
		 *
		 * @since 9.0
		 */
		addAndFetchFileInfo: function(fileName, dir, options) {
			var self = this;
			var deferred = $.Deferred();
			if (_.isUndefined(dir)) {
				dir = this.getCurrentDirectory();
			} else {
				dir = dir || '/';
			}

			var targetPath = OC.joinPaths(dir, fileName);

			if ((OC.dirname(targetPath) || '/') !== this.getCurrentDirectory()) {
				// no need to fetch information
				deferred.resolve();
				return deferred.promise();
			}

			var addOptions = _.extend({
				animate: true,
				scrollTo: false
			}, options || {});

			this.filesClient.getFileInfo(targetPath, {
					properties: this._getWebdavProperties()
				})
				.then(function(status, data) {
					// remove first to avoid duplicates
					self.remove(data.name);
					self.add(data, addOptions);
					deferred.resolve(status, data);
				})
				.fail(function(status) {
					OC.Notification.show(t('files', 'Could not create file "{file}"',
						{file: name}), {type: 'error'}
					);
					deferred.reject(status);
				});

			return deferred.promise();
		},

		/**
		 * Returns whether the given file name exists in the list
		 *
		 * @param {string} file file name
		 *
		 * @return {bool} true if the file exists in the list, false otherwise
		 */
		inList:function(file) {
			return this.findFile(file);
		},

		/**
		 * Shows busy state on a given file row or multiple
		 *
		 * @param {string|Array.<string>} files file name or array of file names
		 * @param {bool} [busy=true] busy state, true for busy, false to remove busy state
		 *
		 * @since 8.2
		 */
		showFileBusyState: function(files, state) {
			var self = this;
			if (!_.isArray(files) && !files.is) {
				files = [files];
			}

			if (_.isUndefined(state)) {
				state = true;
			}

			_.each(files, function(fileName) {
				// jquery element already ?
				var $tr;
				if (_.isString(fileName)) {
					$tr = self.findFileEl(fileName);
				} else {
					$tr = $(fileName);
				}

				var $thumbEl = $tr.find('.thumbnail');
				$tr.toggleClass('busy', state);

				if (state) {
					$thumbEl.parent().addClass('icon-loading-small');
				} else {
					$thumbEl.parent().removeClass('icon-loading-small');
				}
			});
		},

		/**
		 * Delete the given files from the given dir
		 * @param files file names list (without path)
		 * @param dir directory in which to delete the files, defaults to the current
		 * directory
		 */
		do_delete:function(files, dir) {
			var self = this;
			if (files && files.substr) {
				files=[files];
			}
			if (!files) {
				// delete all files in directory
				files = _.pluck(this.files, 'name');
			}
			if (files) {
				this.showFileBusyState(files, true);
			}
			// Finish any existing actions
			if (this.lastAction) {
				this.lastAction();
			}

			dir = dir || this.getCurrentDirectory();

			function removeFromList(file) {
				var fileEl = self.remove(file, {updateSummary: false});
				// FIXME: not sure why we need this after the
				// element isn't even in the DOM any more
				fileEl.find('.selectCheckBox').prop('checked', false);
				fileEl.removeClass('selected');
				self.fileSummary.remove({type: fileEl.attr('data-type'), size: fileEl.attr('data-size')});
				// TODO: this info should be returned by the ajax call!
				self.updateEmptyContent();
				self.fileSummary.update();
				self.updateSelectionSummary();
				// FIXME: don't repeat this, do it once all files are done
				self.updateStorageStatistics();
				self.updateStorageQuotas();
			}

			_.each(files, function(file) {
				self.filesClient.remove(dir + '/' + file)
					.done(function() {
						removeFromList(file);
					})
					.fail(function(status) {
						if (status === 404) {
							// the file already did not exist, remove it from the list
							removeFromList(file);
						} else {
							// only reset the spinner for that one file
							OC.Notification.show(t('files', 'Error deleting file "{fileName}".',
								{fileName: file}), {type: 'error'}
							);
							var deleteAction = self.findFileEl(file).find('.action.delete');
							deleteAction.removeClass('icon-loading-small').addClass('icon-delete');
							self.showFileBusyState(files, false);
						}
					});
			});
		},
		/**
		 * Creates the file summary section
		 */
		_createSummary: function() {
			var $tr = $('<tr class="summary"></tr>');

			if (this._allowSelection) {
				// Dummy column for selection, as all rows must have the same
				// number of columns.
				$tr.append('<td></td>');
			}

			this.$el.find('tfoot').append($tr);

			return new OCA.Files.FileSummary($tr, {config: this._filesConfig});
		},
		updateEmptyContent: function() {
			var permissions = this.getDirectoryPermissions();
			var isCreatable = (permissions & OC.PERMISSION_CREATE) !== 0;
			this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty);
			this.$el.find('#emptycontent .uploadmessage').toggleClass('hidden', !isCreatable || !this.isEmpty);
			this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty);
		},
		/**
		 * Shows the loading mask.
		 *
		 * @see OCA.Files.FileList#hideMask
		 */
		showMask: function() {
			// in case one was shown before
			var $mask = this.$el.find('.mask');
			if ($mask.exists()) {
				return;
			}

			this.$table.addClass('hidden');
			this.$el.find('#emptycontent').addClass('hidden');

			$mask = $('<div class="mask transparent icon-loading"></div>');

			this.$el.append($mask);

			$mask.removeClass('transparent');
		},
		/**
		 * Hide the loading mask.
		 * @see OCA.Files.FileList#showMask
		 */
		hideMask: function() {
			this.$el.find('.mask').remove();
			this.$table.removeClass('hidden');
		},
		scrollTo:function(file) {
			if (!_.isArray(file)) {
				file = [file];
			}
			if (file.length === 1) {
				_.defer(function() {
					this.showDetailsView(file[0]);
				}.bind(this));
			}
			this.highlightFiles(file, function($tr) {
				$tr.addClass('searchresult');
				$tr.one('hover', function() {
					$tr.removeClass('searchresult');
				});
			});
		},
		/**
		 * @deprecated use setFilter(filter)
		 */
		filter:function(query) {
			this.setFilter('');
		},
		/**
		 * @deprecated use setFilter('')
		 */
		unfilter:function() {
			this.setFilter('');
		},
		/**
		 * hide files matching the given filter
		 * @param filter
		 */
		setFilter:function(filter) {
			var total = 0;
			if (this._filter === filter) {
				return;
			}
			this._filter = filter;
			this.fileSummary.setFilter(filter, this.files);
			total = this.fileSummary.getTotal();
			if (!this.$el.find('.mask').exists()) {
				this.hideIrrelevantUIWhenNoFilesMatch();
			}

			var visibleCount = 0;
			filter = filter.toLowerCase();

			function filterRows(tr) {
				var $e = $(tr);
				if ($e.data('file').toString().toLowerCase().indexOf(filter) === -1) {
					$e.addClass('hidden');
				} else {
					visibleCount++;
					$e.removeClass('hidden');
				}
			}

			var $trs = this.$fileList.find('tr');
			do {
				_.each($trs, filterRows);
				if (visibleCount < total) {
					$trs = this._nextPage(false);
				}
			} while (visibleCount < total && $trs.length > 0);

			this.$container.trigger('scroll');
		},
		hideIrrelevantUIWhenNoFilesMatch:function() {
			if (this._filter && this.fileSummary.summary.totalDirs + this.fileSummary.summary.totalFiles === 0) {
				this.$el.find('#filestable thead th').addClass('hidden');
				this.$el.find('#emptycontent').addClass('hidden');
				$('#searchresults').addClass('filter-empty');
				$('#searchresults .emptycontent').addClass('emptycontent-search');
				if ( $('#searchresults').length === 0 || $('#searchresults').hasClass('hidden') ) {
					var error = t('files', 'No search results in other folders for {tag}{filter}{endtag}', {filter:this._filter});
					this.$el.find('.nofilterresults').removeClass('hidden').
						find('p').html(error.replace('{tag}', '<strong>').replace('{endtag}', '</strong>'));
				}
			} else {
				$('#searchresults').removeClass('filter-empty');
				$('#searchresults .emptycontent').removeClass('emptycontent-search');
				this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty);
				if (!this.$el.find('.mask').exists()) {
					this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty);
				}
				this.$el.find('.nofilterresults').addClass('hidden');
			}
		},
		/**
		 * get the current filter
		 * @param filter
		 */
		getFilter:function(filter) {
			return this._filter;
		},
		/**
		 * update the search object to use this filelist when filtering
		 */
		updateSearch:function() {
			if (OCA.Search.files) {
				OCA.Search.files.setFileList(this);
			}
			if (OC.Search) {
				OC.Search.clear();
			}
		},
		/**
		 * Update UI based on the current selection
		 */
		updateSelectionSummary: function() {
			var summary = this._selectionSummary.summary;
			var selection;

			var showHidden = !!this._filesConfig.get('showhidden');
			if (summary.totalFiles === 0 && summary.totalDirs === 0) {
				this.$el.find('#headerName a.name>span:first').text(t('files','Name'));
				this.$el.find('#headerSize a>span:first').text(t('files','Size'));
				this.$el.find('#modified a>span:first').text(t('files','Modified'));
				this.$el.find('table').removeClass('multiselect');
				this.$el.find('.selectedActions').addClass('hidden');
			}
			else {
				this.$el.find('.selectedActions').removeClass('hidden');
				this.$el.find('#headerSize a>span:first').text(OC.Util.humanFileSize(summary.totalSize));

				var directoryInfo = n('files', '%n folder', '%n folders', summary.totalDirs);
				var fileInfo = n('files', '%n file', '%n files', summary.totalFiles);

				if (summary.totalDirs > 0 && summary.totalFiles > 0) {
					var selectionVars = {
						dirs: directoryInfo,
						files: fileInfo
					};
					selection = t('files', '{dirs} and {files}', selectionVars);
				} else if (summary.totalDirs > 0) {
					selection = directoryInfo;
				} else {
					selection = fileInfo;
				}

				if (!showHidden && summary.totalHidden > 0) {
					var hiddenInfo = n('files', 'including %n hidden', 'including %n hidden', summary.totalHidden);
					selection += ' (' + hiddenInfo + ')';
				}

				this.$el.find('#headerName a.name>span:first').text(selection);
				this.$el.find('#modified a>span:first').text('');
				this.$el.find('table').addClass('multiselect');
				this.$el.find('.selectedActions .copy-move').toggleClass('hidden', !this.isSelectedCopiableOrMovable());
				this.$el.find('.selectedActions .download').toggleClass('hidden', !this.isSelectedDownloadable());
				this.$el.find('.delete-selected').toggleClass('hidden', !this.isSelectedDeletable());
			}
		},

		/**
		 * Check whether all selected files are copiable or movable
		 */
		isSelectedCopiableOrMovable: function() {
			return _.reduce(this.getSelectedFiles(), function(copiableOrMovable, file) {
				return copiableOrMovable && (file.permissions & OC.PERMISSION_UPDATE);
			}, true);
		},

		/**
		 * Check whether all selected files are downloadable
		 */
		isSelectedDownloadable: function() {
			return _.reduce(this.getSelectedFiles(), function(downloadable, file) {
				return downloadable && (file.permissions & OC.PERMISSION_READ);
			}, true);
		},

		/**
		 * Check whether all selected files are deletable
		 */
		isSelectedDeletable: function() {
			return _.reduce(this.getSelectedFiles(), function(deletable, file) {
				return deletable && (file.permissions & OC.PERMISSION_DELETE);
			}, true);
		},

		/**
		 * Returns whether all files are selected
		 * @return true if all files are selected, false otherwise
		 */
		isAllSelected: function() {
			return this.$el.find('.select-all').prop('checked');
		},

		/**
		 * Returns the file info of the selected files
		 *
		 * @return array of file names
		 */
		getSelectedFiles: function() {
			return _.values(this._selectedFiles);
		},

		getUniqueName: function(name) {
			if (this.findFileEl(name).exists()) {
				var numMatch;
				var parts=name.split('.');
				var extension = "";
				if (parts.length > 1) {
					extension=parts.pop();
				}
				var base=parts.join('.');
				numMatch=base.match(/\((\d+)\)/);
				var num=2;
				if (numMatch && numMatch.length>0) {
					num=parseInt(numMatch[numMatch.length-1], 10)+1;
					base=base.split('(');
					base.pop();
					base=$.trim(base.join('('));
				}
				name=base+' ('+num+')';
				if (extension) {
					name = name+'.'+extension;
				}
				// FIXME: ugly recursion
				return this.getUniqueName(name);
			}
			return name;
		},

		/**
		 * Shows a "permission denied" notification
		 */
		_showPermissionDeniedNotification: function() {
			var message = t('files', 'You don’t have permission to upload or create files here');
			OC.Notification.show(message, {type: 'error'});
		},

		/**
		 * Setup file upload events related to the file-upload plugin
		 *
		 * @param {OC.Uploader} uploader
		 */
		setupUploadEvents: function(uploader) {
			var self = this;

			self._uploads = {};

			// detect the progress bar resize
			uploader.on('resized', this._onResize);

			uploader.on('drop', function(e, data) {
				self._uploader.log('filelist handle fileuploaddrop', e, data);

				if (self.$el.hasClass('hidden')) {
					// do not upload to invisible lists
					e.preventDefault();
					return false;
				}

				var dropTarget = $(e.delegatedEvent.target);

				// check if dropped inside this container and not another one
				if (dropTarget.length
					&& !self.$el.is(dropTarget) // dropped on list directly
					&& !self.$el.has(dropTarget).length // dropped inside list
					&& !dropTarget.is(self.$container) // dropped on main container
					) {
					e.preventDefault();
					return false;
				}

				// find the closest tr or crumb to use as target
				dropTarget = dropTarget.closest('tr, .crumb');

				// if dropping on tr or crumb, drag&drop upload to folder
				if (dropTarget && (dropTarget.data('type') === 'dir' ||
					dropTarget.hasClass('crumb'))) {

					// remember as context
					data.context = dropTarget;

					// if permissions are specified, only allow if create permission is there
					var permissions = dropTarget.data('permissions');
					if (!_.isUndefined(permissions) && (permissions & OC.PERMISSION_CREATE) === 0) {
						self._showPermissionDeniedNotification();
						return false;
					}
					var dir = dropTarget.data('file');
					// if from file list, need to prepend parent dir
					if (dir) {
						var parentDir = self.getCurrentDirectory();
						if (parentDir[parentDir.length - 1] !== '/') {
							parentDir += '/';
						}
						dir = parentDir + dir;
					}
					else{
						// read full path from crumb
						dir = dropTarget.data('dir') || '/';
					}

					// add target dir
					data.targetDir = dir;
				} else {
					// cancel uploads to current dir if no permission
					var isCreatable = (self.getDirectoryPermissions() & OC.PERMISSION_CREATE) !== 0;
					if (!isCreatable) {
						self._showPermissionDeniedNotification();
						e.stopPropagation();
						return false;
					}

					// we are dropping somewhere inside the file list, which will
					// upload the file to the current directory
					data.targetDir = self.getCurrentDirectory();
				}
			});
			uploader.on('add', function(e, data) {
				self._uploader.log('filelist handle fileuploadadd', e, data);

				// add ui visualization to existing folder
				if (data.context && data.context.data('type') === 'dir') {
					// add to existing folder

					// update upload counter ui
					var uploadText = data.context.find('.uploadtext');
					var currentUploads = parseInt(uploadText.attr('currentUploads'), 10);
					currentUploads += 1;
					uploadText.attr('currentUploads', currentUploads);

					var translatedText = n('files', 'Uploading %n file', 'Uploading %n files', currentUploads);
					if (currentUploads === 1) {
						self.showFileBusyState(uploadText.closest('tr'), true);
						uploadText.text(translatedText);
						uploadText.show();
					} else {
						uploadText.text(translatedText);
					}
				}

				if (!data.targetDir) {
					data.targetDir = self.getCurrentDirectory();
				}

			});
			/*
			 * when file upload done successfully add row to filelist
			 * update counter when uploading to sub folder
			 */
			uploader.on('done', function(e, upload) {
				self._uploader.log('filelist handle fileuploaddone', e, data);

				var data = upload.data;
				var status = data.jqXHR.status;
				if (status < 200 || status >= 300) {
					// error was handled in OC.Uploads already
					return;
				}

				var fileName = upload.getFileName();
				var fetchInfoPromise = self.addAndFetchFileInfo(fileName, upload.getFullPath());
				if (!self._uploads) {
					self._uploads = {};
				}
				if (OC.isSamePath(OC.dirname(upload.getFullPath() + '/'), self.getCurrentDirectory())) {
					self._uploads[fileName] = fetchInfoPromise;
				}

				var uploadText = self.$fileList.find('tr .uploadtext');
				self.showFileBusyState(uploadText.closest('tr'), false);
				uploadText.fadeOut();
				uploadText.attr('currentUploads', 0);

				self.updateStorageQuotas();
			});
			uploader.on('createdfolder', function(fullPath) {
				self.addAndFetchFileInfo(OC.basename(fullPath), OC.dirname(fullPath));
			});
			uploader.on('stop', function() {
				self._uploader.log('filelist handle fileuploadstop');

				// prepare list of uploaded file names in the current directory
				// and discard the other ones
				var promises = _.values(self._uploads);
				var fileNames = _.keys(self._uploads);
				self._uploads = [];

				// as soon as all info is fetched
				$.when.apply($, promises).then(function() {
					// highlight uploaded files
					self.highlightFiles(fileNames);
					self.updateStorageStatistics();
				});

				var uploadText = self.$fileList.find('tr .uploadtext');
				self.showFileBusyState(uploadText.closest('tr'), false);
				uploadText.fadeOut();
				uploadText.attr('currentUploads', 0);
			});
			uploader.on('fail', function(e, data) {
				self._uploader.log('filelist handle fileuploadfail', e, data);
				self._uploads = [];

				//if user pressed cancel hide upload chrome
				//cleanup uploading to a dir
				var uploadText = self.$fileList.find('tr .uploadtext');
				self.showFileBusyState(uploadText.closest('tr'), false);
				uploadText.fadeOut();
				uploadText.attr('currentUploads', 0);
				self.updateStorageStatistics();
			});

		},

		/**
		 * Scroll to the last file of the given list
		 * Highlight the list of files
		 * @param files array of filenames,
		 * @param {Function} [highlightFunction] optional function
		 * to be called after the scrolling is finished
		 */
		highlightFiles: function(files, highlightFunction) {
			// Detection of the uploaded element
			var filename = files[files.length - 1];
			var $fileRow = this.findFileEl(filename);

			while(!$fileRow.exists() && this._nextPage(false) !== false) { // Checking element existence
				$fileRow = this.findFileEl(filename);
			}

			if (!$fileRow.exists()) { // Element not present in the file list
				return;
			}

			var currentOffset = this.$container.scrollTop();
			var additionalOffset = this.$el.find("#controls").height()+this.$el.find("#controls").offset().top;

			// Animation
			var _this = this;
			var $scrollContainer = this.$container;
			if ($scrollContainer[0] === window) {
				// need to use "body" to animate scrolling
				// when the scroll container is the window
				$scrollContainer = $('body');
			}
			$scrollContainer.animate({
				// Scrolling to the top of the new element
				scrollTop: currentOffset + $fileRow.offset().top - $fileRow.height() * 2 - additionalOffset
			}, {
				duration: 500,
				complete: function() {
					// Highlighting function
					var highlightRow = highlightFunction;

					if (!highlightRow) {
						highlightRow = function($fileRow) {
							$fileRow.addClass("highlightUploaded");
							setTimeout(function() {
								$fileRow.removeClass("highlightUploaded");
							}, 2500);
						};
					}

					// Loop over uploaded files
					for(var i=0; i<files.length; i++) {
						var $fileRow = _this.findFileEl(files[i]);

						if($fileRow.length !== 0) { // Checking element existence
							highlightRow($fileRow);
						}
					}

				}
			});
		},

		_renderNewButton: function() {
			// if an upload button (legacy) already exists or no actions container exist, skip
			var $actionsContainer = this.$el.find('#controls .actions');
			if (!$actionsContainer.length || this.$el.find('.button.upload').length) {
				return;
			}
			if (!this._addButtonTemplate) {
				this._addButtonTemplate = Handlebars.compile(TEMPLATE_ADDBUTTON);
			}
			var $newButton = $(this._addButtonTemplate({
				addText: t('files', 'New'),
				iconClass: 'icon-add'
			}));

			$actionsContainer.prepend($newButton);
			$newButton.tooltip({'placement': 'bottom'});

			$newButton.click(_.bind(this._onClickNewButton, this));
			this._newButton = $newButton;
		},

		_onClickNewButton: function(event) {
			var $target = $(event.target);
			if (!$target.hasClass('.button')) {
				$target = $target.closest('.button');
			}
			this._newButton.tooltip('hide');
			event.preventDefault();
			if ($target.hasClass('disabled')) {
				return false;
			}
			if (!this._newFileMenu) {
				this._newFileMenu = new OCA.Files.NewFileMenu({
					fileList: this
				});
				$('.actions').append(this._newFileMenu.$el);
			}
			this._newFileMenu.showAt($target);

			return false;
		},

		/**
		 * Register a tab view to be added to all views
		 */
		registerTabView: function(tabView) {
			if (this._detailsView) {
				this._detailsView.addTabView(tabView);
			}
		},

		/**
		 * Register a detail view to be added to all views
		 */
		registerDetailView: function(detailView) {
			if (this._detailsView) {
				this._detailsView.addDetailView(detailView);
			}
		},

		/**
		 * Register a view to be added to the breadcrumb view
		 */
		registerBreadCrumbDetailView: function(detailView) {
			if (this.breadcrumb) {
				this.breadcrumb.addDetailView(detailView);
			}
		},

		/**
		 * Returns the registered detail views.
		 *
		 * @return null|Array<OCA.Files.DetailFileInfoView> an array with the
		 *         registered DetailFileInfoViews, or null if the details view
		 *         is not enabled.
		 */
		getRegisteredDetailViews: function() {
			if (this._detailsView) {
				return this._detailsView.getDetailViews();
			}

			return null;
		}
	};

	/**
	 * Sort comparators.
	 * @namespace OCA.Files.FileList.Comparators
	 * @private
	 */
	FileList.Comparators = {
		/**
		 * Compares two file infos by name, making directories appear
		 * first.
		 *
		 * @param {OC.Files.FileInfo} fileInfo1 file info
		 * @param {OC.Files.FileInfo} fileInfo2 file info
		 * @return {int} -1 if the first file must appear before the second one,
		 * 0 if they are identify, 1 otherwise.
		 */
		name: function(fileInfo1, fileInfo2) {
			if (fileInfo1.type === 'dir' && fileInfo2.type !== 'dir') {
				return -1;
			}
			if (fileInfo1.type !== 'dir' && fileInfo2.type === 'dir') {
				return 1;
			}
			return OC.Util.naturalSortCompare(fileInfo1.name, fileInfo2.name);
		},
		/**
		 * Compares two file infos by size.
		 *
		 * @param {OC.Files.FileInfo} fileInfo1 file info
		 * @param {OC.Files.FileInfo} fileInfo2 file info
		 * @return {int} -1 if the first file must appear before the second one,
		 * 0 if they are identify, 1 otherwise.
		 */
		size: function(fileInfo1, fileInfo2) {
			return fileInfo1.size - fileInfo2.size;
		},
		/**
		 * Compares two file infos by timestamp.
		 *
		 * @param {OC.Files.FileInfo} fileInfo1 file info
		 * @param {OC.Files.FileInfo} fileInfo2 file info
		 * @return {int} -1 if the first file must appear before the second one,
		 * 0 if they are identify, 1 otherwise.
		 */
		mtime: function(fileInfo1, fileInfo2) {
			return fileInfo1.mtime - fileInfo2.mtime;
		}
	};

	/**
	 * File info attributes.
	 *
	 * @typedef {Object} OC.Files.FileInfo
	 *
	 * @lends OC.Files.FileInfo
	 *
	 * @deprecated use OC.Files.FileInfo instead
	 *
	 */
	OCA.Files.FileInfo = OC.Files.FileInfo;

	OCA.Files.FileList = FileList;
})();

$(document).ready(function() {
	// FIXME: unused ?
	OCA.Files.FileList.useUndo = (window.onbeforeunload)?true:false;
	$(window).bind('beforeunload', function () {
		if (OCA.Files.FileList.lastAction) {
			OCA.Files.FileList.lastAction();
		}
	});
	$(window).on('unload', function () {
		$(window).trigger('beforeunload');
	});

});


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
(function() {

	/**
	 * Construct a new FileActions instance
	 * @constructs Files
	 */
	var Files = function() {
		this.initialize();
	};
	/**
	 * @memberof OCA.Search
	 */
	Files.prototype = {

		fileList: null,

		/**
		 * Initialize the file search
		 */
		initialize: function() {

			var self = this;

			this.fileAppLoaded = function() {
				return !!OCA.Files && !!OCA.Files.App;
			};
			function inFileList($row, result) {
				if (! self.fileAppLoaded()) {
					return false;
				}
				var dir = self.fileList.getCurrentDirectory().replace(/\/+$/,'');
				var resultDir = OC.dirname(result.path);
				return dir === resultDir && self.fileList.inList(result.name);
			}
			function updateLegacyMimetype(result) {
				// backward compatibility:
				if (!result.mime && result.mime_type) {
					result.mime = result.mime_type;
				}
			}
			function hideNoFilterResults() {
				var $nofilterresults = $('.nofilterresults');
				if ( ! $nofilterresults.hasClass('hidden') ) {
					$nofilterresults.addClass('hidden');
				}
			}

			this.renderFolderResult = function($row, result) {
				if (inFileList($row, result)) {
					return null;
				}
				hideNoFilterResults();
				/*render folder icon, show path beneath filename,
				 show size and last modified date on the right */
				this.updateLegacyMimetype(result);

				var $pathDiv = $('<div class="path"></div>').text(result.path.substr(1, result.path.lastIndexOf("/")));
				$row.find('td.info div.name').after($pathDiv).text(result.name);

				$row.find('td.result a').attr('href', result.link);
				$row.find('td.icon').css('background-image', 'url(' +  OC.MimeType.getIconUrl(result.mime) + ')');
				return $row;
			};

			this.renderFileResult = function($row, result) {
				if (inFileList($row, result)) {
					return null;
				}
				hideNoFilterResults();
				/*render preview icon, show path beneath filename,
				 show size and last modified date on the right */
				this.updateLegacyMimetype(result);

				var $pathDiv = $('<div class="path"></div>').text(result.path.substr(1, result.path.lastIndexOf("/")));
				$row.find('td.info div.name').after($pathDiv).text(result.name);

				$row.find('td.result a').attr('href', result.link);

				if (self.fileAppLoaded()) {
					self.fileList.lazyLoadPreview({
						path: result.path,
						mime: result.mime,
						callback: function (url) {
							$row.find('td.icon').css('background-image', 'url(' + url + ')');
						}
					});
				} else {
					// FIXME how to get mime icon if not in files app
					var mimeicon = result.mime.replace('/', '-');
					$row.find('td.icon').css('background-image', 'url(' + OC.MimeType.getIconUrl(result.mime) + ')');
					var dir = OC.dirname(result.path);
					if (dir === '') {
						dir = '/';
					}
					$row.find('td.info a').attr('href',
						OC.generateUrl('/apps/files/?dir={dir}&scrollto={scrollto}', {dir: dir, scrollto: result.name})
					);
				}
				return $row;
			};


			this.handleFolderClick = function($row, result, event) {
				// open folder
				if (self.fileAppLoaded() && self.fileList.id === 'files') {
					self.fileList.changeDirectory(result.path);
					return false;
				} else {
					return true;
				}
			};

			this.handleFileClick = function($row, result, event) {
				if (self.fileAppLoaded() && self.fileList.id === 'files') {
					self.fileList.changeDirectory(OC.dirname(result.path));
					self.fileList.scrollTo(result.name);
					return false;
				} else {
					return true;
				}
			};

			this.updateLegacyMimetype = function (result) {
				// backward compatibility:
				if (!result.mime && result.mime_type) {
					result.mime = result.mime_type;
				}
			};
			this.setFileList = function (fileList) {
				this.fileList = fileList;
			};

			OC.Plugins.register('OCA.Search', this);
		},
		attach: function(search) {
			var self = this;
			search.setFilter('files', function (query) {
				if (self.fileAppLoaded()) {
					self.fileList.setFilter(query);
					if (query.length > 2) {
						//search is not started until 500msec have passed
						window.setTimeout(function() {
							$('.nofilterresults').addClass('hidden');
						}, 500);
					}
				}
			});

			search.setRenderer('folder', this.renderFolderResult.bind(this));
			search.setRenderer('file',   this.renderFileResult.bind(this));
			search.setRenderer('image',   this.renderFileResult.bind(this));
			search.setRenderer('audio',   this.renderFileResult.bind(this));

			search.setHandler('folder',  this.handleFolderClick.bind(this));
			search.setHandler(['file', 'audio', 'image'], this.handleFileClick.bind(this));

			if (self.fileAppLoaded()) {
				// hide results when switching directory outside of search results
				$('#app-content').delegate('>div', 'changeDirectory', function() {
					search.clear();
				});
			}
		}
	};
	OCA.Search.Files = Files;
	OCA.Search.files = new Files();
})();


/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

// HACK: this piece needs to be loaded AFTER the files app (for unit tests)
$(document).ready(function() {
	(function(OCA) {
		/**
		 * @class OCA.Files.FavoritesFileList
		 * @augments OCA.Files.FavoritesFileList
		 *
		 * @classdesc Favorites file list.
		 * Displays the list of files marked as favorites
		 *
		 * @param $el container element with existing markup for the #controls
		 * and a table
		 * @param [options] map of options, see other parameters
		 */
		var FavoritesFileList = function($el, options) {
			this.initialize($el, options);
		};
		FavoritesFileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
			/** @lends OCA.Files.FavoritesFileList.prototype */ {
			id: 'favorites',
			appName: t('files','Favorites'),

			_clientSideSort: true,
			_allowSelection: false,

			/**
			 * @private
			 */
			initialize: function($el, options) {
				OCA.Files.FileList.prototype.initialize.apply(this, arguments);
				if (this.initialized) {
					return;
				}
				OC.Plugins.attach('OCA.Files.FavoritesFileList', this);
			},

			updateEmptyContent: function() {
				var dir = this.getCurrentDirectory();
				if (dir === '/') {
					// root has special permissions
					this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty);
					this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty);
				}
				else {
					OCA.Files.FileList.prototype.updateEmptyContent.apply(this, arguments);
				}
			},

			getDirectoryPermissions: function() {
				return OC.PERMISSION_READ | OC.PERMISSION_DELETE;
			},

			updateStorageStatistics: function() {
				// no op because it doesn't have
				// storage info like free space / used space
			},

			reload: function() {
				this.showMask();
				if (this._reloadCall) {
					this._reloadCall.abort();
				}

				// there is only root
				this._setCurrentDir('/', false);

				this._reloadCall = this.filesClient.getFilteredFiles(
					{
						favorite: true
					},
					{
						properties: this._getWebdavProperties()
					}
				);
				var callBack = this.reloadCallback.bind(this);
				return this._reloadCall.then(callBack, callBack);
			},

			reloadCallback: function(status, result) {
				if (result) {
					// prepend empty dir info because original handler
					result.unshift({});
				}

				return OCA.Files.FileList.prototype.reloadCallback.call(this, status, result);
			},

			_onUrlChanged: function (e) {
				if (e && _.isString(e.dir)) {
					this.changeDirectory(e.dir, false, true);
				}
			}
		});

		OCA.Files.FavoritesFileList = FavoritesFileList;
	})(OCA);
});



/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

// HACK: this piece needs to be loaded AFTER the files app (for unit tests)
$(document).ready(function () {
	(function (OCA) {
		/**
		 * @class OCA.Files.RecentFileList
		 * @augments OCA.Files.RecentFileList
		 *
		 * @classdesc Recent file list.
		 * Displays the list of recently modified files
		 *
		 * @param $el container element with existing markup for the #controls
		 * and a table
		 * @param [options] map of options, see other parameters
		 */
		var RecentFileList = function ($el, options) {
			options.sorting = {
				mode: 'mtime',
				direction: 'desc'
			};
			this.initialize($el, options);
			this._allowSorting = false;
		};
		RecentFileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
			/** @lends OCA.Files.RecentFileList.prototype */ {
				id: 'recent',
				appName: t('files', 'Recent'),

				_clientSideSort: true,
				_allowSelection: false,

				/**
				 * @private
				 */
				initialize: function () {
					OCA.Files.FileList.prototype.initialize.apply(this, arguments);
					if (this.initialized) {
						return;
					}
					OC.Plugins.attach('OCA.Files.RecentFileList', this);
				},

				updateEmptyContent: function () {
					var dir = this.getCurrentDirectory();
					if (dir === '/') {
						// root has special permissions
						this.$el.find('#emptycontent').toggleClass('hidden', !this.isEmpty);
						this.$el.find('#filestable thead th').toggleClass('hidden', this.isEmpty);
					}
					else {
						OCA.Files.FileList.prototype.updateEmptyContent.apply(this, arguments);
					}
				},

				getDirectoryPermissions: function () {
					return OC.PERMISSION_READ | OC.PERMISSION_DELETE;
				},

				updateStorageStatistics: function () {
					// no op because it doesn't have
					// storage info like free space / used space
				},

				reload: function () {
					this.showMask();
					if (this._reloadCall) {
						this._reloadCall.abort();
					}

					// there is only root
					this._setCurrentDir('/', false);

					this._reloadCall = $.ajax({
						url: OC.generateUrl('/apps/files/api/v1/recent'),
						type: 'GET',
						dataType: 'json'
					});
					var callBack = this.reloadCallback.bind(this);
					return this._reloadCall.then(callBack, callBack);
				},

				reloadCallback: function (result) {
					delete this._reloadCall;
					this.hideMask();

					if (result.files) {
						this.setFiles(result.files.sort(this._sortComparator));
						return true;
					}
					return false;
				}
			});

		OCA.Files.RecentFileList = RecentFileList;
	})(OCA);
});



/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global Handlebars */

(function(OCA) {

	_.extend(OC.Files.Client, {
		PROPERTY_TAGS:	'{' + OC.Files.Client.NS_OWNCLOUD + '}tags',
		PROPERTY_FAVORITE:	'{' + OC.Files.Client.NS_OWNCLOUD + '}favorite'
	});

	var TEMPLATE_FAVORITE_MARK =
		'<div ' +
		'class="favorite-mark {{#isFavorite}}permanent{{/isFavorite}}">' +
		'<span class="icon {{iconClass}}" />' +
		'<span class="hidden-visually">{{altText}}</span>' +
		'</div>';

	/**
	 * Returns the icon class for the matching state
	 *
	 * @param {boolean} state true if starred, false otherwise
	 * @return {string} icon class for star image
	 */
	function getStarIconClass(state) {
		return state ? 'icon-starred' : 'icon-star';
	}

	/**
	 * Render the star icon with the given state
	 *
	 * @param {boolean} state true if starred, false otherwise
	 * @return {Object} jQuery object
	 */
	function renderStar(state) {
		if (!this._template) {
			this._template = Handlebars.compile(TEMPLATE_FAVORITE_MARK);
		}
		return this._template({
			isFavorite: state,
			altText: state ? t('files', 'Favorited') : t('files', 'Not favorited'),
			iconClass: getStarIconClass(state)
		});
	}

	/**
	 * Toggle star icon on favorite mark element
	 *
	 * @param {Object} $favoriteMarkEl favorite mark element
	 * @param {boolean} state true if starred, false otherwise
	 */
	function toggleStar($favoriteMarkEl, state) {
		$favoriteMarkEl.removeClass('icon-star icon-starred').addClass(getStarIconClass(state));
		$favoriteMarkEl.toggleClass('permanent', state);
	}

	OCA.Files = OCA.Files || {};

	/**
	 * @namespace OCA.Files.TagsPlugin
	 *
	 * Extends the file actions and file list to include a favorite mark icon
	 * and a favorite action in the file actions menu; it also adds "data-tags"
	 * and "data-favorite" attributes to file elements.
	 */
	OCA.Files.TagsPlugin = {
		name: 'Tags',

		allowedLists: [
			'files',
			'favorites',
			'systemtags',
			'shares.self',
			'shares.others',
			'shares.link'
		],

		_extendFileActions: function(fileActions) {
			var self = this;

			fileActions.registerAction({
				name: 'Favorite',
				displayName: function(context) {
					var $file = context.$file;
					var isFavorite = $file.data('favorite') === true;

					if (isFavorite) {
						return t('files', 'Remove from favorites');
					}

					// As it is currently not possible to provide a context for
					// the i18n strings "Add to favorites" was used instead of
					// "Favorite" to remove the ambiguity between verb and noun
					// when it is translated.
					return t('files', 'Add to favorites');
				},
				mime: 'all',
				order: -100,
				permissions: OC.PERMISSION_NONE,
				iconClass: function(fileName, context) {
					var $file = context.$file;
					var isFavorite = $file.data('favorite') === true;

					if (isFavorite) {
						return 'icon-star-dark';
					}

					return 'icon-starred';
				},
				actionHandler: function(fileName, context) {
					var $favoriteMarkEl = context.$file.find('.favorite-mark');
					var $file = context.$file;
					var fileInfo = context.fileList.files[$file.index()];
					var dir = context.dir || context.fileList.getCurrentDirectory();
					var tags = $file.attr('data-tags');
					if (_.isUndefined(tags)) {
						tags = '';
					}
					tags = tags.split('|');
					tags = _.without(tags, '');
					var isFavorite = tags.indexOf(OC.TAG_FAVORITE) >= 0;
					if (isFavorite) {
						// remove tag from list
						tags = _.without(tags, OC.TAG_FAVORITE);
					} else {
						tags.push(OC.TAG_FAVORITE);
					}

					// pre-toggle the star
					toggleStar($favoriteMarkEl, !isFavorite);

					context.fileInfoModel.trigger('busy', context.fileInfoModel, true);

					self.applyFileTags(
						dir + '/' + fileName,
						tags,
						$favoriteMarkEl,
						isFavorite
					).then(function(result) {
						context.fileInfoModel.trigger('busy', context.fileInfoModel, false);
						// response from server should contain updated tags
						var newTags = result.tags;
						if (_.isUndefined(newTags)) {
							newTags = tags;
						}
						context.fileInfoModel.set({
							'tags': newTags,
							'favorite': !isFavorite
						});
					});
				}
			});
		},

		_extendFileList: function(fileList) {
			// extend row prototype
			var oldCreateRow = fileList._createRow;
			fileList._createRow = function(fileData) {
				var $tr = oldCreateRow.apply(this, arguments);
				var isFavorite = false;
				if (fileData.tags) {
					$tr.attr('data-tags', fileData.tags.join('|'));
					if (fileData.tags.indexOf(OC.TAG_FAVORITE) >= 0) {
						$tr.attr('data-favorite', true);
						isFavorite = true;
					}
				}
				var $icon = $(renderStar(isFavorite));
				$tr.find('td.filename .thumbnail').append($icon);
				return $tr;
			};
			var oldElementToFile = fileList.elementToFile;
			fileList.elementToFile = function($el) {
				var fileInfo = oldElementToFile.apply(this, arguments);
				var tags = $el.attr('data-tags');
				if (_.isUndefined(tags)) {
					tags = '';
				}
				tags = tags.split('|');
				tags = _.without(tags, '');
				fileInfo.tags = tags;
				return fileInfo;
			};

			var oldGetWebdavProperties = fileList._getWebdavProperties;
			fileList._getWebdavProperties = function() {
				var props = oldGetWebdavProperties.apply(this, arguments);
				props.push(OC.Files.Client.PROPERTY_TAGS);
				props.push(OC.Files.Client.PROPERTY_FAVORITE);
				return props;
			};

			fileList.filesClient.addFileInfoParser(function(response) {
				var data = {};
				var props = response.propStat[0].properties;
				var tags = props[OC.Files.Client.PROPERTY_TAGS];
				var favorite = props[OC.Files.Client.PROPERTY_FAVORITE];
				if (tags && tags.length) {
					tags = _.chain(tags).filter(function(xmlvalue) {
						return (xmlvalue.namespaceURI === OC.Files.Client.NS_OWNCLOUD && xmlvalue.nodeName.split(':')[1] === 'tag');
					}).map(function(xmlvalue) {
						return xmlvalue.textContent || xmlvalue.text;
					}).value();
				}
				if (tags) {
					data.tags = tags;
				}
				if (favorite && parseInt(favorite, 10) !== 0) {
					data.tags = data.tags || [];
					data.tags.push(OC.TAG_FAVORITE);
				}
				return data;
			});
		},

		attach: function(fileList) {
			if (this.allowedLists.indexOf(fileList.id) < 0) {
				return;
			}
			this._extendFileActions(fileList.fileActions);
			this._extendFileList(fileList);
		},

		/**
		 * Replaces the given files' tags with the specified ones.
		 *
		 * @param {String} fileName path to the file or folder to tag
		 * @param {Array.<String>} tagNames array of tag names
		 * @param {Object} $favoriteMarkEl favorite mark element
		 * @param {boolean} isFavorite Was the item favorited before
		 */
		applyFileTags: function(fileName, tagNames, $favoriteMarkEl, isFavorite) {
			var encodedPath = OC.encodePath(fileName);
			while (encodedPath[0] === '/') {
				encodedPath = encodedPath.substr(1);
			}
			return $.ajax({
				url: OC.generateUrl('/apps/files/api/v1/files/') + encodedPath,
				contentType: 'application/json',
				data: JSON.stringify({
					tags: tagNames || []
				}),
				dataType: 'json',
				type: 'POST'
			}).fail(function(response) {
				var message = '';
				// show message if it is available
				if(response.responseJSON && response.responseJSON.message) {
					message = ': ' + response.responseJSON.message;
				}
				OC.Notification.show(t('files', 'An error occurred while trying to update the tags' + message), {type: 'error'});
				toggleStar($favoriteMarkEl, isFavorite);
			});
		}
	};
})(OCA);

OC.Plugins.register('OCA.Files.FileList', OCA.Files.TagsPlugin);


/*
 * Copyright (c) 2016 Robin Appelman <robin@icewind.nl>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */


(function (OCA) {

	OCA.Files = OCA.Files || {};

	/**
	 * @namespace OCA.Files.GotoPlugin
	 *
	 */
	OCA.Files.GotoPlugin = {
		name: 'Goto',

		disallowedLists: [
			'files',
			'trashbin'
		],

		attach: function (fileList) {
			if (this.disallowedLists.indexOf(fileList.id) !== -1) {
				return;
			}
			var fileActions = fileList.fileActions;

			fileActions.registerAction({
				name: 'Goto',
				displayName: t('files', 'View in folder'),
				mime: 'all',
				permissions: OC.PERMISSION_ALL,
				iconClass: 'icon-goto nav-icon-extstoragemounts',
				type: OCA.Files.FileActions.TYPE_DROPDOWN,
				actionHandler: function (fileName, context) {
					var fileModel = context.fileInfoModel;
					OC.Apps.hideAppSidebar($('.detailsView'));
					OCA.Files.App.setActiveView('files', {silent: true});
					OCA.Files.App.fileList.changeDirectory(fileModel.get('path'), true, true).then(function() {
						OCA.Files.App.fileList.scrollTo(fileModel.get('name'));
					});
				},
				render: function (actionSpec, isDefault, context) {
					return fileActions._defaultRenderAction.call(fileActions, actionSpec, isDefault, context)
						.removeClass('permanent');
				}
			});
		}
	};
})(OCA);

OC.Plugins.register('OCA.Files.FileList', OCA.Files.GotoPlugin);



/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function(OCA) {
	/**
	 * @namespace OCA.Files.FavoritesPlugin
	 *
	 * Registers the favorites file list from the files app sidebar.
	 */
	OCA.Files.FavoritesPlugin = {
		name: 'Favorites',

		/**
		 * @type OCA.Files.FavoritesFileList
		 */
		favoritesFileList: null,

		attach: function() {
			var self = this;
			$('#app-content-favorites').on('show.plugin-favorites', function(e) {
				self.showFileList($(e.target));
			});
			$('#app-content-favorites').on('hide.plugin-favorites', function() {
				self.hideFileList();
			});
		},

		detach: function() {
			if (this.favoritesFileList) {
				this.favoritesFileList.destroy();
				OCA.Files.fileActions.off('setDefault.plugin-favorites', this._onActionsUpdated);
				OCA.Files.fileActions.off('registerAction.plugin-favorites', this._onActionsUpdated);
				$('#app-content-favorites').off('.plugin-favorites');
				this.favoritesFileList = null;
			}
		},

		showFileList: function($el) {
			if (!this.favoritesFileList) {
				this.favoritesFileList = this._createFavoritesFileList($el);
			}
			return this.favoritesFileList;
		},

		hideFileList: function() {
			if (this.favoritesFileList) {
				this.favoritesFileList.$fileList.empty();
			}
		},

		/**
		 * Creates the favorites file list.
		 *
		 * @param $el container for the file list
		 * @return {OCA.Files.FavoritesFileList} file list
		 */
		_createFavoritesFileList: function($el) {
			var fileActions = this._createFileActions();
			// register favorite list for sidebar section
			return new OCA.Files.FavoritesFileList(
				$el, {
					fileActions: fileActions,
					scrollContainer: $('#app-content')
				}
			);
		},

		_createFileActions: function() {
			// inherit file actions from the files app
			var fileActions = new OCA.Files.FileActions();
			// note: not merging the legacy actions because legacy apps are not
			// compatible with the sharing overview and need to be adapted first
			fileActions.registerDefaultActions();
			fileActions.merge(OCA.Files.fileActions);

			if (!this._globalActionsInitialized) {
				// in case actions are registered later
				this._onActionsUpdated = _.bind(this._onActionsUpdated, this);
				OCA.Files.fileActions.on('setDefault.plugin-favorites', this._onActionsUpdated);
				OCA.Files.fileActions.on('registerAction.plugin-favorites', this._onActionsUpdated);
				this._globalActionsInitialized = true;
			}

			// when the user clicks on a folder, redirect to the corresponding
			// folder in the files app instead of opening it directly
			fileActions.register('dir', 'Open', OC.PERMISSION_READ, '', function (filename, context) {
				OCA.Files.App.setActiveView('files', {silent: true});
				OCA.Files.App.fileList.changeDirectory(OC.joinPaths(context.$file.attr('data-path'), filename), true, true);
			});
			fileActions.setDefault('dir', 'Open');
			return fileActions;
		},

		_onActionsUpdated: function(ev) {
			if (ev.action) {
				this.favoritesFileList.fileActions.registerAction(ev.action);
			} else if (ev.defaultAction) {
				this.favoritesFileList.fileActions.setDefault(
					ev.defaultAction.mime,
					ev.defaultAction.name
				);
			}
		}
	};

})(OCA);

OC.Plugins.register('OCA.Files.App', OCA.Files.FavoritesPlugin);



/*
 * Copyright (c) 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function (OCA) {
	/**
	 * @namespace OCA.Files.RecentPlugin
	 *
	 * Registers the recent file list from the files app sidebar.
	 */
	OCA.Files.RecentPlugin = {
		name: 'Recent',

		/**
		 * @type OCA.Files.RecentFileList
		 */
		recentFileList: null,

		attach: function () {
			var self = this;
			$('#app-content-recent').on('show.plugin-recent', function (e) {
				self.showFileList($(e.target));
			});
			$('#app-content-recent').on('hide.plugin-recent', function () {
				self.hideFileList();
			});
		},

		detach: function () {
			if (this.recentFileList) {
				this.recentFileList.destroy();
				OCA.Files.fileActions.off('setDefault.plugin-recent', this._onActionsUpdated);
				OCA.Files.fileActions.off('registerAction.plugin-recent', this._onActionsUpdated);
				$('#app-content-recent').off('.plugin-recent');
				this.recentFileList = null;
			}
		},

		showFileList: function ($el) {
			if (!this.recentFileList) {
				this.recentFileList = this._createRecentFileList($el);
			}
			return this.recentFileList;
		},

		hideFileList: function () {
			if (this.recentFileList) {
				this.recentFileList.$fileList.empty();
			}
		},

		/**
		 * Creates the recent file list.
		 *
		 * @param $el container for the file list
		 * @return {OCA.Files.RecentFileList} file list
		 */
		_createRecentFileList: function ($el) {
			var fileActions = this._createFileActions();
			// register recent list for sidebar section
			return new OCA.Files.RecentFileList(
				$el, {
					fileActions: fileActions,
					scrollContainer: $('#app-content')
				}
			);
		},

		_createFileActions: function () {
			// inherit file actions from the files app
			var fileActions = new OCA.Files.FileActions();
			// note: not merging the legacy actions because legacy apps are not
			// compatible with the sharing overview and need to be adapted first
			fileActions.registerDefaultActions();
			fileActions.merge(OCA.Files.fileActions);

			if (!this._globalActionsInitialized) {
				// in case actions are registered later
				this._onActionsUpdated = _.bind(this._onActionsUpdated, this);
				OCA.Files.fileActions.on('setDefault.plugin-recent', this._onActionsUpdated);
				OCA.Files.fileActions.on('registerAction.plugin-recent', this._onActionsUpdated);
				this._globalActionsInitialized = true;
			}

			// when the user clicks on a folder, redirect to the corresponding
			// folder in the files app instead of opening it directly
			fileActions.register('dir', 'Open', OC.PERMISSION_READ, '', function (filename, context) {
				OCA.Files.App.setActiveView('files', {silent: true});
				var path = OC.joinPaths(context.$file.attr('data-path'), filename);
				OCA.Files.App.fileList.changeDirectory(path, true, true);
			});
			fileActions.setDefault('dir', 'Open');
			return fileActions;
		},

		_onActionsUpdated: function (ev) {
			if (ev.action) {
				this.recentFileList.fileActions.registerAction(ev.action);
			} else if (ev.defaultAction) {
				this.recentFileList.fileActions.setDefault(
					ev.defaultAction.mime,
					ev.defaultAction.name
				);
			}
		}
	};

})(OCA);

OC.Plugins.register('OCA.Files.App', OCA.Files.RecentPlugin);



/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	/**
	 * @class OCA.Files.DetailFileInfoView
	 * @classdesc
	 *
	 * Displays a block of details about the file info.
	 *
	 */
	var DetailFileInfoView = OC.Backbone.View.extend({
		tagName: 'div',
		className: 'detailFileInfoView',

		_template: null,

		/**
		 * returns the jQuery object for HTML output
		 *
		 * @returns {jQuery}
		 */
		get$: function() {
			return this.$el;
		},

		/**
		 * Sets the file info to be displayed in the view
		 *
		 * @param {OCA.Files.FileInfo} fileInfo file info to set
		 */
		setFileInfo: function(fileInfo) {
			this.model = fileInfo;
			this.render();
		},

		/**
		 * Returns the file info.
		 *
		 * @return {OCA.Files.FileInfo} file info
		 */
		getFileInfo: function() {
			return this.model;
		}
	});

	OCA.Files.DetailFileInfoView = DetailFileInfoView;
})();



/*
 * Copyright (c) 2016
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function () {
	SidebarPreviewManager = function (fileList) {
		this._fileList = fileList;
		this._previewHandlers = {};
		OC.Plugins.attach('OCA.Files.SidebarPreviewManager', this);
	};

	SidebarPreviewManager.prototype = {
		addPreviewHandler: function (mime, handler) {
			this._previewHandlers[mime] = handler;
		},

		getMimeTypePreviewHandler: function(mime) {
			var mimePart = mime.split('/').shift();
			if (this._previewHandlers[mime]) {
				return this._previewHandlers[mime];
			} else if (this._previewHandlers[mimePart]) {
				return this._previewHandlers[mimePart];
			} else {
				return null;
			}
		},

		getPreviewHandler: function (mime) {
			var mimetypeHandler = this.getMimeTypePreviewHandler(mime);
			if (mimetypeHandler) {
				return mimetypeHandler;
			} else {
				return this.fallbackPreview.bind(this);
			}
		},

		loadPreview: function (model, $thumbnailDiv, $thumbnailContainer) {
			if (model.get('hasPreview') === false && this.getMimeTypePreviewHandler(model.get('mimetype')) === null) {
				var mimeIcon = OC.MimeType.getIconUrl(model.get('mimetype'));
				$thumbnailDiv.removeClass('icon-loading icon-32');
				$thumbnailContainer.removeClass('image'); //fall back to regular view
				$thumbnailDiv.css({
					'background-image': 'url("' + mimeIcon + '")'
				});
			} else {
				var handler = this.getPreviewHandler(model.get('mimetype'));
				var fallback = this.fallbackPreview.bind(this, model, $thumbnailDiv, $thumbnailContainer);
				handler(model, $thumbnailDiv, $thumbnailContainer, fallback);
			}
		},

		// previews for images and mimetype icons
		fallbackPreview: function (model, $thumbnailDiv, $thumbnailContainer) {
			var isImage = model.isImage();
			var maxImageWidth = $thumbnailContainer.parent().width() + 50;  // 50px for negative margins
			var maxImageHeight = maxImageWidth / (16 / 9);
			var smallPreviewSize = 75;

			var isLandscape = function (img) {
				return img.width > (img.height * 1.2);
			};

			var isSmall = function (img) {
				return (img.width * 1.1) < (maxImageWidth * window.devicePixelRatio);
			};

			var getTargetHeight = function (img) {
				if (isImage) {
					var targetHeight = img.height / window.devicePixelRatio;
					if (targetHeight <= smallPreviewSize) {
						targetHeight = smallPreviewSize;
					}
					return targetHeight;
				} else {
					return smallPreviewSize;
				}
			};

			var getTargetRatio = function (img) {
				var ratio = img.width / img.height;
				if (ratio > 16 / 9) {
					return ratio;
				} else {
					return 16 / 9;
				}
			};

			this._fileList.lazyLoadPreview({
				path: model.getFullPath(),
				mime: model.get('mimetype'),
				etag: model.get('etag'),
				y: isImage ? maxImageHeight : smallPreviewSize,
				x: isImage ? maxImageWidth : smallPreviewSize,
				a: isImage ? 1 : null,
				mode: isImage ? 'cover' : null,
				callback: function (previewUrl, img) {
					$thumbnailDiv.previewImg = previewUrl;

					// as long as we only have the mimetype icon, we only save it in case there is no preview
					if (!img) {
						return;
					}
					$thumbnailDiv.removeClass('icon-loading icon-32');
					var targetHeight = getTargetHeight(img);
					if (isImage && targetHeight > smallPreviewSize) {
						$thumbnailContainer.addClass((isLandscape(img) && !isSmall(img)) ? 'landscape' : 'portrait');
						$thumbnailContainer.addClass('large');
					}

					// only set background when we have an actual preview
					// when we don't have a preview we show the mime icon in the error handler
					$thumbnailDiv.css({
						'background-image': 'url("' + previewUrl + '")',
						height: (targetHeight > smallPreviewSize) ? 'auto' : targetHeight,
						'max-height': isSmall(img) ? targetHeight : null
					});

					var targetRatio = getTargetRatio(img);
					$thumbnailDiv.find('.stretcher').css({
						'padding-bottom': (100 / targetRatio) + '%'
					});
				},
				error: function () {
					$thumbnailDiv.removeClass('icon-loading icon-32');
					$thumbnailContainer.removeClass('image'); //fall back to regular view
					$thumbnailDiv.css({
						'background-image': 'url("' + $thumbnailDiv.previewImg + '")'
					});
				}
			});
		}
	};

	OCA.Files.SidebarPreviewManager = SidebarPreviewManager;
})();


/*
 * Copyright (c) 2016
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function () {
	var SidebarPreview = function () {
	};

	SidebarPreview.prototype = {
		attach: function (manager) {
			manager.addPreviewHandler('text', this.handlePreview.bind(this));
		},

		handlePreview: function (model, $thumbnailDiv, $thumbnailContainer, fallback) {
			var previewWidth = $thumbnailContainer.parent().width() + 50;  // 50px for negative margins
			var previewHeight = previewWidth / (16 / 9);

			this.getFileContent(model.getFullPath()).then(function (content) {
				$thumbnailDiv.removeClass('icon-loading icon-32');
				$thumbnailContainer.addClass('large');
				$thumbnailContainer.addClass('text');
				var $textPreview = $('<pre/>').text(content);
				$thumbnailDiv.children('.stretcher').remove();
				$thumbnailDiv.append($textPreview);
				$thumbnailContainer.css("max-height", previewHeight);
			}, function () {
				fallback();
			});
		},

		getFileContent: function (path) {
			return $.ajax({
				url: OC.linkToRemoteBase('files' + path),
				headers: {
					'Range': 'bytes=0-10240'
				}
			});
		}
	};

	OC.Plugins.register('OCA.Files.SidebarPreviewManager', new SidebarPreview());
})();


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	/**
	 * @class OCA.Files.DetailTabView
	 * @classdesc
	 *
	 * Base class for tab views to display file information.
	 *
	 */
	var DetailTabView = OC.Backbone.View.extend({
		tag: 'div',

		className: 'tab',

		/**
		 * Tab label
		 */
		_label: null,

		_template: null,

		initialize: function(options) {
			options = options || {};
			if (!this.id) {
				this.id = 'detailTabView' + DetailTabView._TAB_COUNT;
				DetailTabView._TAB_COUNT++;
			}
			if (options.order) {
				this.order = options.order || 0;
			}
		},

		/**
		 * Returns the tab label
		 *
		 * @return {String} label
		 */
		getLabel: function() {
			return 'Tab ' + this.id;
		},

		/**
		 * returns the jQuery object for HTML output
		 *
		 * @returns {jQuery}
		 */
		get$: function() {
			return this.$el;
		},

		/**
		 * Renders this details view
		 *
		 * @abstract
		 */
		render: function() {
			// to be implemented in subclass
			// FIXME: code is only for testing
			this.$el.html('<div>Hello ' + this.id + '</div>');
		},

		/**
		 * Sets the file info to be displayed in the view
		 *
		 * @param {OCA.Files.FileInfoModel} fileInfo file info to set
		 */
		setFileInfo: function(fileInfo) {
			if (this.model !== fileInfo) {
				this.model = fileInfo;
				this.render();
			}
		},

		/**
		 * Returns the file info.
		 *
		 * @return {OCA.Files.FileInfoModel} file info
		 */
		getFileInfo: function() {
			return this.model;
		},

		/**
		 * Load the next page of results
		 */
		nextPage: function() {
			// load the next page, if applicable
		},

		/**
		 * Returns whether the current tab is able to display
		 * the given file info, for example based on mime type.
		 *
		 * @param {OCA.Files.FileInfoModel} fileInfo file info model
		 * @return {bool} whether to display this tab
		 */
		canDisplay: function(fileInfo) {
			return true;
		}
	});
	DetailTabView._TAB_COUNT = 0;

	OCA.Files = OCA.Files || {};

	OCA.Files.DetailTabView = DetailTabView;
})();



/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	var TEMPLATE =
		'<div class="thumbnailContainer"><a href="#" class="thumbnail action-default"><div class="stretcher"/></a></div>' +
		'<div class="file-details-container">' +
		'<div class="fileName">' +
			'<h3 title="{{name}}" class="ellipsis">{{name}}</h3>' +
			'<a class="permalink" href="{{permalink}}" title="{{permalinkTitle}}" data-clipboard-text="{{permalink}}">' +
				'<span class="icon icon-clippy"></span>' +
				'<span class="hidden-visually">{{permalinkTitle}}</span>' +
			'</a>' +
		'</div>' +
		'	<div class="file-details ellipsis">' +
		'		{{#if hasFavoriteAction}}' +
		'		<a href="#" class="action action-favorite favorite permanent">' +
		'			<span class="icon {{starClass}}" title="{{starAltText}}"></span>' +
		'		</a>' +
		'		{{/if}}' +
		'		{{#if hasSize}}<span class="size" title="{{altSize}}">{{size}}</span>, {{/if}}<span class="date live-relative-timestamp" data-timestamp="{{timestamp}}" title="{{altDate}}">{{date}}</span>' +
		'	</div>' +
		'</div>' +
		'<div class="hidden permalink-field">' +
			'<input type="text" value="{{permalink}}" placeholder="{{permalinkTitle}}" readonly="readonly"/>' +
		'</div>';

	/**
	 * @class OCA.Files.MainFileInfoDetailView
	 * @classdesc
	 *
	 * Displays main details about a file
	 *
	 */
	var MainFileInfoDetailView = OCA.Files.DetailFileInfoView.extend(
		/** @lends OCA.Files.MainFileInfoDetailView.prototype */ {

		className: 'mainFileInfoView',

		/**
		 * Associated file list instance, for file actions
		 *
		 * @type {OCA.Files.FileList}
		 */
		_fileList: null,

		/**
		 * File actions
		 *
		 * @type {OCA.Files.FileActions}
		 */
		_fileActions: null,

		/**
		 * @type {OCA.Files.SidebarPreviewManager}
		 */
		_previewManager: null,

		events: {
			'click a.action-favorite': '_onClickFavorite',
			'click a.action-default': '_onClickDefaultAction',
			'click a.permalink': '_onClickPermalink',
			'focus .permalink-field>input': '_onFocusPermalink'
		},

		template: function(data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(data);
		},

		initialize: function(options) {
			options = options || {};
			this._fileList = options.fileList;
			this._fileActions = options.fileActions;
			if (!this._fileList) {
				throw 'Missing required parameter "fileList"';
			}
			if (!this._fileActions) {
				throw 'Missing required parameter "fileActions"';
			}
			this._previewManager = new OCA.Files.SidebarPreviewManager(this._fileList);

			this._setupClipboard();
		},

		_setupClipboard: function() {
			var clipboard = new Clipboard('.permalink');
			clipboard.on('success', function(e) {
				var $el = $(e.trigger);
				$el.tooltip('hide')
					.attr('data-original-title', t('core', 'Copied!'))
					.tooltip('fixTitle')
					.tooltip({placement: 'bottom', trigger: 'manual'})
					.tooltip('show');
				_.delay(function() {
					$el.tooltip('hide');
					$el.attr('data-original-title', t('files', 'Copy direct link (only works for users who have access to this file/folder)'))
						.tooltip('fixTitle');
				}, 3000);
			});
			clipboard.on('error', function(e) {
				var $row = this.$('.permalink-field');
				$row.toggleClass('hidden');
				if (!$row.hasClass('hidden')) {
					$row.find('>input').focus();
				}
			});
		},

		_onClickPermalink: function(e) {
			e.preventDefault();
			return;
		},

		_onFocusPermalink: function() {
			this.$('.permalink-field>input').select();
		},

		_onClickFavorite: function(event) {
			event.preventDefault();
			this._fileActions.triggerAction('Favorite', this.model, this._fileList);
		},

		_onClickDefaultAction: function(event) {
			event.preventDefault();
			this._fileActions.triggerAction(null, this.model, this._fileList);
		},

		_onModelChanged: function() {
			// simply re-render
			this.render();
		},

		_makePermalink: function(fileId) {
			var baseUrl = OC.getProtocol() + '://' + OC.getHost();
			return baseUrl + OC.generateUrl('/f/{fileId}', {fileId: fileId});
		},

		setFileInfo: function(fileInfo) {
			if (this.model) {
				this.model.off('change', this._onModelChanged, this);
			}
			this.model = fileInfo;
			if (this.model) {
				this.model.on('change', this._onModelChanged, this);
			}

			if (this.model) {
				var properties = [];
				if( !this.model.has('size') ) {
					properties.push(OC.Files.Client.PROPERTY_SIZE);
					properties.push(OC.Files.Client.PROPERTY_GETCONTENTLENGTH);
				}

				if( properties.length > 0){
					this.model.reloadProperties(properties);
				}
			}

			this.render();
		},

		/**
		 * Renders this details view
		 */
		render: function() {
			this.trigger('pre-render');

			if (this.model) {
				var isFavorite = (this.model.get('tags') || []).indexOf(OC.TAG_FAVORITE) >= 0;
				var availableActions = this._fileActions.get(
					this.model.get('mimetype'),
					this.model.get('type'),
					this.model.get('permissions')
				);
				var hasFavoriteAction = 'Favorite' in availableActions;
				this.$el.html(this.template({
					type: this.model.isImage()? 'image': '',
					nameLabel: t('files', 'Name'),
					name: this.model.get('displayName') || this.model.get('name'),
					pathLabel: t('files', 'Path'),
					path: this.model.get('path'),
					hasSize: this.model.has('size'),
					sizeLabel: t('files', 'Size'),
					size: OC.Util.humanFileSize(this.model.get('size'), true),
					altSize: n('files', '%n byte', '%n bytes', this.model.get('size')),
					dateLabel: t('files', 'Modified'),
					altDate: OC.Util.formatDate(this.model.get('mtime')),
					timestamp: this.model.get('mtime'),
					date: OC.Util.relativeModifiedDate(this.model.get('mtime')),
					hasFavoriteAction: hasFavoriteAction,
					starAltText: isFavorite ? t('files', 'Favorited') : t('files', 'Favorite'),
					starClass: isFavorite ? 'icon-starred' : 'icon-star',
					permalink: this._makePermalink(this.model.get('id')),
					permalinkTitle: t('files', 'Copy direct link (only works for users who have access to this file/folder)')
				}));

				// TODO: we really need OC.Previews
				var $iconDiv = this.$el.find('.thumbnail');
				var $container = this.$el.find('.thumbnailContainer');
				if (!this.model.isDirectory()) {
					$iconDiv.addClass('icon-loading icon-32');
					this._previewManager.loadPreview(this.model, $iconDiv, $container);
				} else {
					var iconUrl = this.model.get('icon') || OC.MimeType.getIconUrl('dir');
					$iconDiv.css('background-image', 'url("' + iconUrl + '")');
					OC.Util.scaleFixForIE8($iconDiv);
				}
				this.$el.find('[title]').tooltip({placement: 'bottom'});
			} else {
				this.$el.empty();
			}
			this.delegateEvents();

			this.trigger('post-render');
		}
	});

	OCA.Files.MainFileInfoDetailView = MainFileInfoDetailView;
})();


/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	var TEMPLATE =
		'	<div class="detailFileInfoContainer">' +
		'	</div>' +
		'	{{#if tabHeaders}}' +
		'	<ul class="tabHeaders">' +
		'		{{#each tabHeaders}}' +
		'		<li class="tabHeader" data-tabid="{{tabId}}" data-tabindex="{{tabIndex}}">' +
		'			<a href="#">{{label}}</a>' +
		'		</li>' +
		'		{{/each}}' +
		'	</ul>' +
		'	{{/if}}' +
		'	<div class="tabsContainer">' +
		'	</div>' +
		'	<a class="close icon-close" href="#"><span class="hidden-visually">{{closeLabel}}</span></a>';

	/**
	 * @class OCA.Files.DetailsView
	 * @classdesc
	 *
	 * The details view show details about a selected file.
	 *
	 */
	var DetailsView = OC.Backbone.View.extend({
		id: 'app-sidebar',
		tabName: 'div',
		className: 'detailsView scroll-container',

		_template: null,

		/**
		 * List of detail tab views
		 *
		 * @type Array<OCA.Files.DetailTabView>
		 */
		_tabViews: [],

		/**
		 * List of detail file info views
		 *
		 * @type Array<OCA.Files.DetailFileInfoView>
		 */
		_detailFileInfoViews: [],

		/**
		 * Id of the currently selected tab
		 *
		 * @type string
		 */
		_currentTabId: null,

		/**
		 * Dirty flag, whether the view needs to be rerendered
		 */
		_dirty: false,

		events: {
			'click a.close': '_onClose',
			'click .tabHeaders .tabHeader': '_onClickTab'
		},

		/**
		 * Initialize the details view
		 */
		initialize: function() {
			this._tabViews = [];
			this._detailFileInfoViews = [];

			this._dirty = true;
		},

		_onClose: function(event) {
			OC.Apps.hideAppSidebar(this.$el);
			event.preventDefault();
		},

		_onClickTab: function(e) {
			var $target = $(e.target);
			e.preventDefault();
			if (!$target.hasClass('tabHeader')) {
				$target = $target.closest('.tabHeader');
			}
			var tabId = $target.attr('data-tabid');
			if (_.isUndefined(tabId)) {
				return;
			}

			this.selectTab(tabId);
		},

		template: function(vars) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(vars);
		},

		/**
		 * Renders this details view
		 */
		render: function() {
			var templateVars = {
				closeLabel: t('files', 'Close')
			};

			this._tabViews = this._tabViews.sort(function(tabA, tabB) {
				var orderA = tabA.order || 0;
				var orderB = tabB.order || 0;
				if (orderA === orderB) {
					return OC.Util.naturalSortCompare(tabA.getLabel(), tabB.getLabel());
				}
				return orderA - orderB;
			});

			templateVars.tabHeaders = _.map(this._tabViews, function(tabView, i) {
				return {
					tabId: tabView.id,
					tabIndex: i,
					label: tabView.getLabel()
				};
			});

			this.$el.html(this.template(templateVars));

			var $detailsContainer = this.$el.find('.detailFileInfoContainer');

			// render details
			_.each(this._detailFileInfoViews, function(detailView) {
				$detailsContainer.append(detailView.get$());
			});

			if (!this._currentTabId && this._tabViews.length > 0) {
				this._currentTabId = this._tabViews[0].id;
			}

			this.selectTab(this._currentTabId);

			this._updateTabVisibilities();

			this._dirty = false;
		},

		/**
		 * Selects the given tab by id
		 *
		 * @param {string} tabId tab id
		 */
		selectTab: function(tabId) {
			if (!tabId) {
				return;
			}

			var tabView = _.find(this._tabViews, function(tab) {
				return tab.id === tabId;
			});

			if (!tabView) {
				console.warn('Details view tab with id "' + tabId + '" not found');
				return;
			}

			this._currentTabId = tabId;

			var $tabsContainer = this.$el.find('.tabsContainer');
			var $tabEl = $tabsContainer.find('#' + tabId);

			// hide other tabs
			$tabsContainer.find('.tab').addClass('hidden');

			// tab already rendered ?
			if (!$tabEl.length) {
				// render tab
				$tabsContainer.append(tabView.$el);
				$tabEl = tabView.$el;
			}

			// this should trigger tab rendering
			tabView.setFileInfo(this.model);

			$tabEl.removeClass('hidden');

			// update tab headers
			var $tabHeaders = this.$el.find('.tabHeaders li');
			$tabHeaders.removeClass('selected');
			$tabHeaders.filterAttr('data-tabid', tabView.id).addClass('selected');
		},

		/**
		 * Sets the file info to be displayed in the view
		 *
		 * @param {OCA.Files.FileInfoModel} fileInfo file info to set
		 */
		setFileInfo: function(fileInfo) {
			this.model = fileInfo;

			if (this._dirty) {
				this.render();
			} else {
				this._updateTabVisibilities();
			}

			if (this._currentTabId) {
				// only update current tab, others will be updated on-demand
				var tabId = this._currentTabId;
				var tabView = _.find(this._tabViews, function(tab) {
					return tab.id === tabId;
				});
				tabView.setFileInfo(fileInfo);
			}

			_.each(this._detailFileInfoViews, function(detailView) {
				detailView.setFileInfo(fileInfo);
			});
		},

		/**
		 * Update tab headers based on the current model
		 */
		_updateTabVisibilities: function() {
			// update tab header visibilities
			var self = this;
			var deselect = false;
			var countVisible = 0;
			var $tabHeaders = this.$el.find('.tabHeaders li');
			_.each(this._tabViews, function(tabView) {
				var isVisible = tabView.canDisplay(self.model);
				if (isVisible) {
					countVisible += 1;
				}
				if (!isVisible && self._currentTabId === tabView.id) {
					deselect = true;
				}
				$tabHeaders.filterAttr('data-tabid', tabView.id).toggleClass('hidden', !isVisible);
			});

			// hide the whole container if there is only one tab
			this.$el.find('.tabHeaders').toggleClass('hidden', countVisible <= 1);

			if (deselect) {
				// select the first visible tab instead
				var visibleTabId = this.$el.find('.tabHeader:not(.hidden):first').attr('data-tabid');
				this.selectTab(visibleTabId);
			}

		},

		/**
		 * Returns the file info.
		 *
		 * @return {OCA.Files.FileInfoModel} file info
		 */
		getFileInfo: function() {
			return this.model;
		},

		/**
		 * Adds a tab in the tab view
		 *
		 * @param {OCA.Files.DetailTabView} tab view
		 */
		addTabView: function(tabView) {
			this._tabViews.push(tabView);
			this._dirty = true;
		},

		/**
		 * Adds a detail view for file info.
		 *
		 * @param {OCA.Files.DetailFileInfoView} detail view
		 */
		addDetailView: function(detailView) {
			this._detailFileInfoViews.push(detailView);
			this._dirty = true;
		},

		/**
		 * Returns an array with the added DetailFileInfoViews.
		 *
		 * @return Array<OCA.Files.DetailFileInfoView> an array with the added
		 *         DetailFileInfoViews.
		 */
		getDetailViews: function() {
			return [].concat(this._detailFileInfoViews);
		}
	});

	OCA.Files.DetailsView = DetailsView;
})();


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	var TEMPLATE_FILE_ACTION_TRIGGER =
		'<a class="action action-{{nameLowerCase}}" href="#" data-action="{{name}}">' +
		'{{#if icon}}' +
			'<img class="svg" alt="{{altText}}" src="{{icon}}" />' +
		'{{else}}' +
			'{{#if iconClass}}<span class="icon {{iconClass}}" />{{/if}}' +
			'{{#unless hasDisplayName}}<span class="hidden-visually">{{altText}}</span>{{/unless}}' +
		'{{/if}}' +
		'{{#if displayName}}<span> {{displayName}}</span>{{/if}}' +
		'</a>';

	/**
	 * Construct a new FileActions instance
	 * @constructs FileActions
	 * @memberof OCA.Files
	 */
	var FileActions = function() {
		this.initialize();
	};
	FileActions.TYPE_DROPDOWN = 0;
	FileActions.TYPE_INLINE = 1;
	FileActions.prototype = {
		/** @lends FileActions.prototype */
		actions: {},
		defaults: {},
		icons: {},

		/**
		 * @deprecated
		 */
		currentFile: null,

		/**
		 * Dummy jquery element, for events
		 */
		$el: null,

		_fileActionTriggerTemplate: null,

		/**
		 * @private
		 */
		initialize: function() {
			this.clear();
			// abusing jquery for events until we get a real event lib
			this.$el = $('<div class="dummy-fileactions hidden"></div>');
			$('body').append(this.$el);

			this._showMenuClosure = _.bind(this._showMenu, this);
		},

		/**
		 * Adds an event handler
		 *
		 * @param {String} eventName event name
		 * @param {Function} callback
		 */
		on: function(eventName, callback) {
			this.$el.on(eventName, callback);
		},

		/**
		 * Removes an event handler
		 *
		 * @param {String} eventName event name
		 * @param Function callback
		 */
		off: function(eventName, callback) {
			this.$el.off(eventName, callback);
		},

		/**
		 * Notifies the event handlers
		 *
		 * @param {String} eventName event name
		 * @param {Object} data data
		 */
		_notifyUpdateListeners: function(eventName, data) {
			this.$el.trigger(new $.Event(eventName, data));
		},

		/**
		 * Merges the actions from the given fileActions into
		 * this instance.
		 *
		 * @param {OCA.Files.FileActions} fileActions instance of OCA.Files.FileActions
		 */
		merge: function(fileActions) {
			var self = this;
			// merge first level to avoid unintended overwriting
			_.each(fileActions.actions, function(sourceMimeData, mime) {
				var targetMimeData = self.actions[mime];
				if (!targetMimeData) {
					targetMimeData = {};
				}
				self.actions[mime] = _.extend(targetMimeData, sourceMimeData);
			});

			this.defaults = _.extend(this.defaults, fileActions.defaults);
			this.icons = _.extend(this.icons, fileActions.icons);
		},
		/**
		 * @deprecated use #registerAction() instead
		 */
		register: function(mime, name, permissions, icon, action, displayName) {
			return this.registerAction({
				name: name,
				mime: mime,
				permissions: permissions,
				icon: icon,
				actionHandler: action,
				displayName: displayName || name
			});
		},

		/**
		 * Register action
		 *
		 * @param {OCA.Files.FileAction} action object
		 */
		registerAction: function (action) {
			var mime = action.mime;
			var name = action.name;
			var actionSpec = {
				action: function(fileName, context) {
					// Actions registered in one FileAction may be executed on a
					// different one (for example, due to the "merge" function),
					// so the listeners have to be updated on the FileActions
					// from the context instead of on the one in which it was
					// originally registered.
					if (context && context.fileActions) {
						context.fileActions._notifyUpdateListeners('beforeTriggerAction', {action: actionSpec, fileName: fileName, context: context});
					}

					action.actionHandler(fileName, context);

					if (context && context.fileActions) {
						context.fileActions._notifyUpdateListeners('afterTriggerAction', {action: actionSpec, fileName: fileName, context: context});
					}
				},
				name: name,
				displayName: action.displayName,
				mime: mime,
				order: action.order || 0,
				icon: action.icon,
				iconClass: action.iconClass,
				permissions: action.permissions,
				type: action.type || FileActions.TYPE_DROPDOWN,
				altText: action.altText || ''
			};
			if (_.isUndefined(action.displayName)) {
				actionSpec.displayName = t('files', name);
			}
			if (_.isFunction(action.render)) {
				actionSpec.render = action.render;
			}
			if (!this.actions[mime]) {
				this.actions[mime] = {};
			}
			this.actions[mime][name] = actionSpec;
			this.icons[name] = action.icon;
			this._notifyUpdateListeners('registerAction', {action: action});
		},
		/**
		 * Clears all registered file actions.
		 */
		clear: function() {
			this.actions = {};
			this.defaults = {};
			this.icons = {};
			this.currentFile = null;
		},
		/**
		 * Sets the default action for a given mime type.
		 *
		 * @param {String} mime mime type
		 * @param {String} name action name
		 */
		setDefault: function (mime, name) {
			this.defaults[mime] = name;
			this._notifyUpdateListeners('setDefault', {defaultAction: {mime: mime, name: name}});
		},

		/**
		 * Returns a map of file actions handlers matching the given conditions
		 *
		 * @param {string} mime mime type
		 * @param {string} type "dir" or "file"
		 * @param {int} permissions permissions
		 *
		 * @return {Object.<string,OCA.Files.FileActions~actionHandler>} map of action name to action spec
		 */
		get: function (mime, type, permissions) {
			var actions = this.getActions(mime, type, permissions);
			var filteredActions = {};
			$.each(actions, function (name, action) {
				filteredActions[name] = action.action;
			});
			return filteredActions;
		},

		/**
		 * Returns an array of file actions matching the given conditions
		 *
		 * @param {string} mime mime type
		 * @param {string} type "dir" or "file"
		 * @param {int} permissions permissions
		 *
		 * @return {Array.<OCA.Files.FileAction>} array of action specs
		 */
		getActions: function (mime, type, permissions) {
			var actions = {};
			if (this.actions.all) {
				actions = $.extend(actions, this.actions.all);
			}
			if (type) {//type is 'dir' or 'file'
				if (this.actions[type]) {
					actions = $.extend(actions, this.actions[type]);
				}
			}
			if (mime) {
				var mimePart = mime.substr(0, mime.indexOf('/'));
				if (this.actions[mimePart]) {
					actions = $.extend(actions, this.actions[mimePart]);
				}
				if (this.actions[mime]) {
					actions = $.extend(actions, this.actions[mime]);
				}
			}
			var filteredActions = {};
			$.each(actions, function (name, action) {
				if ((action.permissions === OC.PERMISSION_NONE) || (action.permissions & permissions)) {
					filteredActions[name] = action;
				}
			});
			return filteredActions;
		},

		/**
		 * Returns the default file action handler for the given conditions
		 *
		 * @param {string} mime mime type
		 * @param {string} type "dir" or "file"
		 * @param {int} permissions permissions
		 *
		 * @return {OCA.Files.FileActions~actionHandler} action handler
		 *
		 * @deprecated use getDefaultFileAction instead
		 */
		getDefault: function (mime, type, permissions) {
			var defaultActionSpec = this.getDefaultFileAction(mime, type, permissions);
			if (defaultActionSpec) {
				return defaultActionSpec.action;
			}
			return undefined;
		},

		/**
		 * Returns the default file action handler for the given conditions
		 *
		 * @param {string} mime mime type
		 * @param {string} type "dir" or "file"
		 * @param {int} permissions permissions
		 *
		 * @return {OCA.Files.FileActions~actionHandler} action handler
		 * @since 8.2
		 */
		getDefaultFileAction: function(mime, type, permissions) {
			var mimePart;
			if (mime) {
				mimePart = mime.substr(0, mime.indexOf('/'));
			}
			var name = false;
			if (mime && this.defaults[mime]) {
				name = this.defaults[mime];
			} else if (mime && this.defaults[mimePart]) {
				name = this.defaults[mimePart];
			} else if (type && this.defaults[type]) {
				name = this.defaults[type];
			} else {
				name = this.defaults.all;
			}
			var actions = this.getActions(mime, type, permissions);
			return actions[name];
		},

		/**
		 * Default function to render actions
		 *
		 * @param {OCA.Files.FileAction} actionSpec file action spec
		 * @param {boolean} isDefault true if the action is a default one,
		 * false otherwise
		 * @param {OCA.Files.FileActionContext} context action context
		 */
		_defaultRenderAction: function(actionSpec, isDefault, context) {
			if (!isDefault) {
				var params = {
					name: actionSpec.name,
					nameLowerCase: actionSpec.name.toLowerCase(),
					displayName: actionSpec.displayName,
					icon: actionSpec.icon,
					iconClass: actionSpec.iconClass,
					altText: actionSpec.altText,
					hasDisplayName: !!actionSpec.displayName
				};
				if (_.isFunction(actionSpec.icon)) {
					params.icon = actionSpec.icon(context.$file.attr('data-file'), context);
				}
				if (_.isFunction(actionSpec.iconClass)) {
					params.iconClass = actionSpec.iconClass(context.$file.attr('data-file'), context);
				}

				var $actionLink = this._makeActionLink(params, context);
				context.$file.find('a.name>span.fileactions').append($actionLink);
				$actionLink.addClass('permanent');
				return $actionLink;
			}
		},

		/**
		 * Renders the action link element
		 *
		 * @param {Object} params action params
		 */
		_makeActionLink: function(params) {
			if (!this._fileActionTriggerTemplate) {
				this._fileActionTriggerTemplate = Handlebars.compile(TEMPLATE_FILE_ACTION_TRIGGER);
			}

			return $(this._fileActionTriggerTemplate(params));
		},

		/**
		 * Displays the file actions dropdown menu
		 *
		 * @param {string} fileName file name
		 * @param {OCA.Files.FileActionContext} context rendering context
		 */
		_showMenu: function(fileName, context) {
			var menu;
			var $trigger = context.$file.closest('tr').find('.fileactions .action-menu');
			$trigger.addClass('open');

			menu = new OCA.Files.FileActionsMenu();

			context.$file.find('td.filename').append(menu.$el);

			menu.$el.on('afterHide', function() {
				context.$file.removeClass('mouseOver');
				$trigger.removeClass('open');
				menu.remove();
			});

			context.$file.addClass('mouseOver');
			menu.show(context);
		},

		/**
		 * Renders the menu trigger on the given file list row
		 *
		 * @param {Object} $tr file list row element
		 * @param {OCA.Files.FileActionContext} context rendering context
		 */
		_renderMenuTrigger: function($tr, context) {
			// remove previous
			$tr.find('.action-menu').remove();

			var $el = this._renderInlineAction({
				name: 'menu',
				displayName: '',
				iconClass: 'icon-more',
				altText: t('files', 'Actions'),
				action: this._showMenuClosure
			}, false, context);

			$el.addClass('permanent');
		},

		/**
		 * Renders the action element by calling actionSpec.render() and
		 * registers the click event to process the action.
		 *
		 * @param {OCA.Files.FileAction} actionSpec file action to render
		 * @param {boolean} isDefault true if the action is a default action,
		 * false otherwise
		 * @param {OCA.Files.FileActionContext} context rendering context
		 */
		_renderInlineAction: function(actionSpec, isDefault, context) {
			var renderFunc = actionSpec.render || _.bind(this._defaultRenderAction, this);
			var $actionEl = renderFunc(actionSpec, isDefault, context);
			if (!$actionEl || !$actionEl.length) {
				return;
			}
			$actionEl.on(
				'click', {
					a: null
				},
				function(event) {
					event.stopPropagation();
					event.preventDefault();

					if ($actionEl.hasClass('open')) {
						return;
					}

					var $file = $(event.target).closest('tr');
					if ($file.hasClass('busy')) {
						return;
					}
					var currentFile = $file.find('td.filename');
					var fileName = $file.attr('data-file');

					context.fileActions.currentFile = currentFile;
					// also set on global object for legacy apps
					window.FileActions.currentFile = currentFile;

					var callContext = _.extend({}, context);

					if (!context.dir && context.fileList) {
						callContext.dir = $file.attr('data-path') || context.fileList.getCurrentDirectory();
					}

					if (!context.fileInfoModel && context.fileList) {
						callContext.fileInfoModel = context.fileList.getModelForFile(fileName);
						if (!callContext.fileInfoModel) {
							console.warn('No file info model found for file "' + fileName + '"');
						}
					}

					actionSpec.action(
						fileName,
						callContext
					);
				}
			);
			$actionEl.tooltip({placement:'top'});
			return $actionEl;
		},

		/**
		 * Trigger the given action on the given file.
		 *
		 * @param {string} actionName action name
		 * @param {OCA.Files.FileInfoModel} fileInfoModel file info model
		 * @param {OCA.Files.FileList} [fileList] file list, for compatibility with older action handlers [DEPRECATED]
		 *
		 * @return {boolean} true if the action handler was called, false otherwise
		 *
		 * @since 8.2
		 */
		triggerAction: function(actionName, fileInfoModel, fileList) {
			var actionFunc;
			var actions = this.get(
				fileInfoModel.get('mimetype'),
				fileInfoModel.isDirectory() ? 'dir' : 'file',
				fileInfoModel.get('permissions')
			);

			if (actionName) {
				actionFunc = actions[actionName];
			} else {
				actionFunc = this.getDefault(
					fileInfoModel.get('mimetype'),
					fileInfoModel.isDirectory() ? 'dir' : 'file',
					fileInfoModel.get('permissions')
				);
			}

			if (!actionFunc) {
				actionFunc = actions['Download'];
			}

			if (!actionFunc) {
				return false;
			}

			var context = {
				fileActions: this,
				fileInfoModel: fileInfoModel,
				dir: fileInfoModel.get('path')
			};

			var fileName = fileInfoModel.get('name');
			this.currentFile = fileName;
			// also set on global object for legacy apps
			window.FileActions.currentFile = fileName;

			if (fileList) {
				// compatibility with action handlers that expect these
				context.fileList = fileList;
				context.$file = fileList.findFileEl(fileName);
			}

			actionFunc(fileName, context);
		},

		/**
		 * Display file actions for the given element
		 * @param parent "td" element of the file for which to display actions
		 * @param triggerEvent if true, triggers the fileActionsReady on the file
		 * list afterwards (false by default)
		 * @param fileList OCA.Files.FileList instance on which the action is
		 * done, defaults to OCA.Files.App.fileList
		 */
		display: function (parent, triggerEvent, fileList) {
			if (!fileList) {
				console.warn('FileActions.display() MUST be called with a OCA.Files.FileList instance');
				return;
			}
			this.currentFile = parent;
			var self = this;
			var $tr = parent.closest('tr');
			var actions = this.getActions(
				this.getCurrentMimeType(),
				this.getCurrentType(),
				this.getCurrentPermissions()
			);
			var nameLinks;
			if ($tr.data('renaming')) {
				return;
			}

			// recreate fileactions container
			nameLinks = parent.children('a.name');
			nameLinks.find('.fileactions, .nametext .action').remove();
			nameLinks.append('<span class="fileactions" />');
			var defaultAction = this.getDefaultFileAction(
				this.getCurrentMimeType(),
				this.getCurrentType(),
				this.getCurrentPermissions()
			);

			var context = {
				$file: $tr,
				fileActions: this,
				fileList: fileList
			};

			$.each(actions, function (name, actionSpec) {
				if (actionSpec.type === FileActions.TYPE_INLINE) {
					self._renderInlineAction(
						actionSpec,
						defaultAction && actionSpec.name === defaultAction.name,
						context
					);
				}
			});

			this._renderMenuTrigger($tr, context);

			if (triggerEvent){
				fileList.$fileList.trigger(jQuery.Event("fileActionsReady", {fileList: fileList, $files: $tr}));
			}
		},
		getCurrentFile: function () {
			return this.currentFile.parent().attr('data-file');
		},
		getCurrentMimeType: function () {
			return this.currentFile.parent().attr('data-mime');
		},
		getCurrentType: function () {
			return this.currentFile.parent().attr('data-type');
		},
		getCurrentPermissions: function () {
			return this.currentFile.parent().data('permissions');
		},

		/**
		 * Register the actions that are used by default for the files app.
		 */
		registerDefaultActions: function() {
			this.registerAction({
				name: 'Download',
				displayName: t('files', 'Download'),
				order: -20,
				mime: 'all',
				permissions: OC.PERMISSION_READ,
				iconClass: 'icon-download',
				actionHandler: function (filename, context) {
					var dir = context.dir || context.fileList.getCurrentDirectory();
					var isDir = context.$file.attr('data-type') === 'dir';
					var url = context.fileList.getDownloadUrl(filename, dir, isDir);

					var downloadFileaction = $(context.$file).find('.fileactions .action-download');

					// don't allow a second click on the download action
					if(downloadFileaction.hasClass('disabled')) {
						return;
					}

					if (url) {
						var disableLoadingState = function() {
							context.fileList.showFileBusyState(filename, false);
						};

						context.fileList.showFileBusyState(filename, true);
						OCA.Files.Files.handleDownload(url, disableLoadingState);
					}
				}
			});

			this.registerAction({
				name: 'Rename',
				displayName: t('files', 'Rename'),
				mime: 'all',
				order: -30,
				permissions: OC.PERMISSION_UPDATE,
				iconClass: 'icon-rename',
				actionHandler: function (filename, context) {
					context.fileList.rename(filename);
				}
			});

			this.registerAction({
				name: 'MoveCopy',
				displayName: t('files', 'Move or copy'),
				mime: 'all',
				order: -25,
				permissions: OC.PERMISSION_UPDATE,
				iconClass: 'icon-external',
				actionHandler: function (filename, context) {
					OC.dialogs.filepicker(t('files', 'Target folder'), function(targetPath, type) {
						if (type === OC.dialogs.FILEPICKER_TYPE_COPY) {
							context.fileList.copy(filename, targetPath);
						}
						if (type === OC.dialogs.FILEPICKER_TYPE_MOVE) {
							context.fileList.move(filename, targetPath);
						}
					}, false, "httpd/unix-directory", true, OC.dialogs.FILEPICKER_TYPE_COPY_MOVE);
				}
			});

			this.register('dir', 'Open', OC.PERMISSION_READ, '', function (filename, context) {
				var dir = context.$file.attr('data-path') || context.fileList.getCurrentDirectory();
				context.fileList.changeDirectory(OC.joinPaths(dir, filename), true, false, parseInt(context.$file.attr('data-id'), 10));
			});

			this.registerAction({
				name: 'Delete',
				displayName: function(context) {
					var mountType = context.$file.attr('data-mounttype');
					var deleteTitle = t('files', 'Delete');
					if (mountType === 'external-root') {
						deleteTitle = t('files', 'Disconnect storage');
					} else if (mountType === 'shared-root') {
						deleteTitle = t('files', 'Unshare');
					}
					return deleteTitle;
				},
				mime: 'all',
				order: 1000,
				// permission is READ because we show a hint instead if there is no permission
				permissions: OC.PERMISSION_DELETE,
				iconClass: 'icon-delete',
				actionHandler: function(fileName, context) {
					// if there is no permission to delete do nothing
					if((context.$file.data('permissions') & OC.PERMISSION_DELETE) === 0) {
						return;
					}
					context.fileList.do_delete(fileName, context.dir);
					$('.tipsy').remove();
				}
			});

			this.setDefault('dir', 'Open');
		}
	};

	OCA.Files.FileActions = FileActions;

	/**
	 * Replaces the download icon with a loading spinner and vice versa
	 * - also adds the class disabled to the passed in element
	 *
	 * @param {jQuery} $downloadButtonElement download fileaction
	 * @param {boolean} showIt whether to show the spinner(true) or to hide it(false)
	 */
	OCA.Files.FileActions.updateFileActionSpinner = function($downloadButtonElement, showIt) {
		var $icon = $downloadButtonElement.find('.icon');
		if (showIt) {
			var $loadingIcon = $('<span class="icon icon-loading-small"></span>');
			$icon.after($loadingIcon);
			$icon.addClass('hidden');
		} else {
			$downloadButtonElement.find('.icon-loading-small').remove();
			$downloadButtonElement.find('.icon').removeClass('hidden');
		}
	};

	/**
	 * File action attributes.
	 *
	 * @todo make this a real class in the future
	 * @typedef {Object} OCA.Files.FileAction
	 *
	 * @property {String} name identifier of the action
	 * @property {(String|OCA.Files.FileActions~displayNameFunction)} displayName
	 * display name string for the action, or function that returns the display name.
	 * Defaults to the name given in name property
	 * @property {String} mime mime type
	 * @property {int} permissions permissions
	 * @property {(Function|String)} icon icon path to the icon or function that returns it (deprecated, use iconClass instead)
	 * @property {(String|OCA.Files.FileActions~iconClassFunction)} iconClass class name of the icon (recommended for theming)
	 * @property {OCA.Files.FileActions~renderActionFunction} [render] optional rendering function
	 * @property {OCA.Files.FileActions~actionHandler} actionHandler action handler function
	 */

	/**
	 * File action context attributes.
	 *
	 * @typedef {Object} OCA.Files.FileActionContext
	 *
	 * @property {Object} $file jQuery file row element
	 * @property {OCA.Files.FileActions} fileActions file actions object
	 * @property {OCA.Files.FileList} fileList file list object
	 */

	/**
	 * Render function for actions.
	 * The function must render a link element somewhere in the DOM
	 * and return it. The function should NOT register the event handler
	 * as this will be done after the link was returned.
	 *
	 * @callback OCA.Files.FileActions~renderActionFunction
	 * @param {OCA.Files.FileAction} actionSpec action definition
	 * @param {Object} $row row container
	 * @param {boolean} isDefault true if the action is the default one,
	 * false otherwise
	 * @return {Object} jQuery link object
	 */

	/**
	 * Display name function for actions.
	 * The function returns the display name of the action using
	 * the given context information..
	 *
	 * @callback OCA.Files.FileActions~displayNameFunction
	 * @param {OCA.Files.FileActionContext} context action context
	 * @return {String} display name
	 */

	/**
	 * Icon class function for actions.
	 * The function returns the icon class of the action using
	 * the given context information.
	 *
	 * @callback OCA.Files.FileActions~iconClassFunction
	 * @param {String} fileName name of the file on which the action must be performed
	 * @param {OCA.Files.FileActionContext} context action context
	 * @return {String} icon class
	 */

	/**
	 * Action handler function for file actions
	 *
	 * @callback OCA.Files.FileActions~actionHandler
	 * @param {String} fileName name of the file on which the action must be performed
	 * @param context context
	 * @param {String} context.dir directory of the file
	 * @param {OCA.Files.FileInfoModel} fileInfoModel file info model
	 * @param {Object} [context.$file] jQuery element of the file [DEPRECATED]
	 * @param {OCA.Files.FileList} [context.fileList] the FileList instance on which the action occurred [DEPRECATED]
	 * @param {OCA.Files.FileActions} context.fileActions the FileActions instance on which the action occurred
	 */

	// global file actions to be used by all lists
	OCA.Files.fileActions = new OCA.Files.FileActions();
	OCA.Files.legacyFileActions = new OCA.Files.FileActions();

	// for backward compatibility
	//
	// legacy apps are expecting a stateful global FileActions object to register
	// their actions on. Since legacy apps are very likely to break with other
	// FileList views than the main one ("All files"), actions registered
	// through window.FileActions will be limited to the main file list.
	// @deprecated use OCA.Files.FileActions instead
	window.FileActions = OCA.Files.legacyFileActions;
	window.FileActions.register = function (mime, name, permissions, icon, action, displayName) {
		console.warn('FileActions.register() is deprecated, please use OCA.Files.fileActions.register() instead', arguments);
		OCA.Files.FileActions.prototype.register.call(
				window.FileActions, mime, name, permissions, icon, action, displayName
		);
	};
	window.FileActions.display = function (parent, triggerEvent, fileList) {
		fileList = fileList || OCA.Files.App.fileList;
		console.warn('FileActions.display() is deprecated, please use OCA.Files.fileActions.register() which automatically redisplays actions', mime, name);
		OCA.Files.FileActions.prototype.display.call(window.FileActions, parent, triggerEvent, fileList);
	};
})();


/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	var TEMPLATE_MENU =
		'<ul>' +
		'{{#each items}}' +
		'<li>' +
		'<a href="#" class="menuitem action action-{{nameLowerCase}} permanent" data-action="{{name}}">' +
			'{{#if icon}}<img class="icon" src="{{icon}}"/>' +
			'{{else}}'+
				'{{#if iconClass}}' +
				'<span class="icon {{iconClass}}"></span>' +
				'{{else}}' +
				'<span class="no-icon"></span>' +
				'{{/if}}' +
			'{{/if}}' +
			'<span>{{displayName}}</span></a>' +
		'</li>' +
		'{{/each}}' +
		'</ul>';

	/**
	 * Construct a new FileActionsMenu instance
	 * @constructs FileActionsMenu
	 * @memberof OCA.Files
	 */
	var FileActionsMenu = OC.Backbone.View.extend({
		tagName: 'div',
		className: 'fileActionsMenu popovermenu bubble hidden open menu',

		/**
		 * Current context
		 *
		 * @type OCA.Files.FileActionContext
		 */
		_context: null,

		events: {
			'click a.action': '_onClickAction'
		},

		template: function(data) {
			if (!OCA.Files.FileActionsMenu._TEMPLATE) {
				OCA.Files.FileActionsMenu._TEMPLATE = Handlebars.compile(TEMPLATE_MENU);
			}
			return OCA.Files.FileActionsMenu._TEMPLATE(data);
		},

		/**
		 * Event handler whenever an action has been clicked within the menu
		 *
		 * @param {Object} event event object
		 */
		_onClickAction: function(event) {
			var $target = $(event.target);
			if (!$target.is('a')) {
				$target = $target.closest('a');
			}
			var fileActions = this._context.fileActions;
			var actionName = $target.attr('data-action');
			var actions = fileActions.getActions(
				fileActions.getCurrentMimeType(),
				fileActions.getCurrentType(),
				fileActions.getCurrentPermissions()
			);
			var actionSpec = actions[actionName];
			var fileName = this._context.$file.attr('data-file');

			event.stopPropagation();
			event.preventDefault();

			OC.hideMenus();

			actionSpec.action(
				fileName,
				this._context
			);
		},

		/**
		 * Renders the menu with the currently set items
		 */
		render: function() {
			var self = this;
			var fileActions = this._context.fileActions;
			var actions = fileActions.getActions(
				fileActions.getCurrentMimeType(),
				fileActions.getCurrentType(),
				fileActions.getCurrentPermissions()
			);

			var defaultAction = fileActions.getDefaultFileAction(
				fileActions.getCurrentMimeType(),
				fileActions.getCurrentType(),
				fileActions.getCurrentPermissions()
			);

			var items = _.filter(actions, function(actionSpec) {
				return (
					actionSpec.type === OCA.Files.FileActions.TYPE_DROPDOWN &&
					(!defaultAction || actionSpec.name !== defaultAction.name)
				);
			});
			items = _.map(items, function(item) {
				if (_.isFunction(item.displayName)) {
					item = _.extend({}, item);
					item.displayName = item.displayName(self._context);
				}
				if (_.isFunction(item.iconClass)) {
					var fileName = self._context.$file.attr('data-file');
					item = _.extend({}, item);
					item.iconClass = item.iconClass(fileName, self._context);
				}
				return item;
			});
			items = items.sort(function(actionA, actionB) {
				var orderA = actionA.order || 0;
				var orderB = actionB.order || 0;
				if (orderB === orderA) {
					return OC.Util.naturalSortCompare(actionA.displayName, actionB.displayName);
				}
				return orderA - orderB;
			});
			items = _.map(items, function(item) {
				item.nameLowerCase = item.name.toLowerCase();
				return item;
			});

			this.$el.html(this.template({
				items: items
			}));
		},

		/**
		 * Displays the menu under the given element
		 *
		 * @param {OCA.Files.FileActionContext} context context
		 * @param {Object} $trigger trigger element
		 */
		show: function(context) {
			this._context = context;

			this.render();
			this.$el.removeClass('hidden');

			OC.showMenu(null, this.$el);
		}
	});

	OCA.Files.FileActionsMenu = FileActionsMenu;

})();



/*
 * Copyright (c) 2014
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global getURLParameter */
/**
 * Utility class for file related operations
 */
(function() {
	var Files = {
		// file space size sync
		_updateStorageStatistics: function(currentDir) {
			var state = Files.updateStorageStatistics;
			if (state.dir){
				if (state.dir === currentDir) {
					return;
				}
				// cancel previous call, as it was for another dir
				state.call.abort();
			}
			state.dir = currentDir;
			state.call = $.getJSON(OC.filePath('files','ajax','getstoragestats.php') + '?dir=' + encodeURIComponent(currentDir),function(response) {
				state.dir = null;
				state.call = null;
				Files.updateMaxUploadFilesize(response);
			});
		},
		// update quota
		updateStorageQuotas: function() {
			var state = Files.updateStorageQuotas;
			state.call = $.getJSON(OC.filePath('files','ajax','getstoragestats.php'),function(response) {
				Files.updateQuota(response);
			});
		},
		/**
		 * Update storage statistics such as free space, max upload,
		 * etc based on the given directory.
		 *
		 * Note this function is debounced to avoid making too
		 * many ajax calls in a row.
		 *
		 * @param dir directory
		 * @param force whether to force retrieving
		 */
		updateStorageStatistics: function(dir, force) {
			if (!OC.currentUser) {
				return;
			}

			if (force) {
				Files._updateStorageStatistics(dir);
			}
			else {
				Files._updateStorageStatisticsDebounced(dir);
			}
		},

		updateMaxUploadFilesize:function(response) {
			if (response === undefined) {
				return;
			}
			if (response.data !== undefined && response.data.uploadMaxFilesize !== undefined) {
				$('#free_space').val(response.data.freeSpace);
				$('#upload.button').attr('data-original-title', response.data.maxHumanFilesize);
				$('#usedSpacePercent').val(response.data.usedSpacePercent);
				$('#owner').val(response.data.owner);
				$('#ownerDisplayName').val(response.data.ownerDisplayName);
				Files.displayStorageWarnings();
			}
			if (response[0] === undefined) {
				return;
			}
			if (response[0].uploadMaxFilesize !== undefined) {
				$('#upload.button').attr('data-original-title', response[0].maxHumanFilesize);
				$('#usedSpacePercent').val(response[0].usedSpacePercent);
				Files.displayStorageWarnings();
			}

		},

		updateQuota:function(response) {
			if (response === undefined) {
				return;
			}
			if (response.data !== undefined
			 && response.data.quota !== undefined
			 && response.data.used !== undefined
			 && response.data.usedSpacePercent !== undefined) {
				var humanUsed = OC.Util.humanFileSize(response.data.used, true);
				var humanQuota = OC.Util.humanFileSize(response.data.quota, true);
				if (response.data.quota > 0) {
					$('#quota').attr('data-original-title', Math.floor(response.data.used/response.data.quota*1000)/10 + '%');
					$('#quota progress').val(response.data.usedSpacePercent);
					$('#quotatext').text(t('files', '{used} of {quota} used', {used: humanUsed, quota: humanQuota}));
				} else {
					$('#quotatext').text(t('files', '{used} used', {used: humanUsed}));
				}
				if (response.data.usedSpacePercent > 80) {
					$('#quota progress').addClass('warn');
				} else {
					$('#quota progress').removeClass('warn');
				}
			}

		},

		/**
		 * Fix path name by removing double slash at the beginning, if any
		 */
		fixPath: function(fileName) {
			if (fileName.substr(0, 2) == '//') {
				return fileName.substr(1);
			}
			return fileName;
		},

		/**
		 * Checks whether the given file name is valid.
		 * @param name file name to check
		 * @return true if the file name is valid.
		 * Throws a string exception with an error message if
		 * the file name is not valid
		 */
		isFileNameValid: function (name) {
			var trimmedName = name.trim();
			if (trimmedName === '.' || trimmedName === '..')
			{
				throw t('files', '"{name}" is an invalid file name.', {name: name});
			} else if (trimmedName.length === 0) {
				throw t('files', 'File name cannot be empty.');
			} else if (trimmedName.indexOf('/') !== -1) {
				throw t('files', '"/" is not allowed inside a file name.');
			} else if (OC.fileIsBlacklisted(trimmedName)) {
				throw t('files', '"{name}" is not an allowed filetype', {name: name});
			}

			return true;
		},
		displayStorageWarnings: function() {
			if (!OC.Notification.isHidden()) {
				return;
			}

			var usedSpacePercent = $('#usedSpacePercent').val(),
				owner = $('#owner').val(),
				ownerDisplayName = $('#ownerDisplayName').val();
			if (usedSpacePercent > 98) {
				if (owner !== oc_current_user) {
					OC.Notification.show(t('files', 'Storage of {owner} is full, files can not be updated or synced anymore!',
						{owner: ownerDisplayName}), {type: 'error'}
					);
					return;
				}
				OC.Notification.show(t('files',
					'Your storage is full, files can not be updated or synced anymore!'),
					{type : 'error'}
				);
				return;
			}
			if (usedSpacePercent > 90) {
				if (owner !== oc_current_user) {
					OC.Notification.show(t('files', 'Storage of {owner} is almost full ({usedSpacePercent}%)',
						{
							usedSpacePercent: usedSpacePercent,
							owner: ownerDisplayName
						}),
						{
							type: 'error'
						}
					);
					return;
				}
				OC.Notification.show(t('files', 'Your storage is almost full ({usedSpacePercent}%)',
					{usedSpacePercent: usedSpacePercent}),
					{type : 'error'}
				);
			}
		},

		/**
		 * Returns the download URL of the given file(s)
		 * @param {string} filename string or array of file names to download
		 * @param {string} [dir] optional directory in which the file name is, defaults to the current directory
		 * @param {bool} [isDir=false] whether the given filename is a directory and might need a special URL
		 */
		getDownloadUrl: function(filename, dir, isDir) {
			if (!_.isArray(filename) && !isDir) {
				var pathSections = dir.split('/');
				pathSections.push(filename);
				var encodedPath = '';
				_.each(pathSections, function(section) {
					if (section !== '') {
						encodedPath += '/' + encodeURIComponent(section);
					}
				});
				return OC.linkToRemoteBase('webdav') + encodedPath;
			}

			if (_.isArray(filename)) {
				filename = JSON.stringify(filename);
			}

			var params = {
				dir: dir,
				files: filename
			};
			return this.getAjaxUrl('download', params);
		},

		/**
		 * Returns the ajax URL for a given action
		 * @param action action string
		 * @param params optional params map
		 */
		getAjaxUrl: function(action, params) {
			var q = '';
			if (params) {
				q = '?' + OC.buildQueryString(params);
			}
			return OC.filePath('files', 'ajax', action + '.php') + q;
		},

		/**
		 * Fetch the icon url for the mimetype
		 * @param {string} mime The mimetype
		 * @param {Files~mimeicon} ready Function to call when mimetype is retrieved
		 * @deprecated use OC.MimeType.getIconUrl(mime)
		 */
		getMimeIcon: function(mime, ready) {
			ready(OC.MimeType.getIconUrl(mime));
		},

		/**
		 * Generates a preview URL based on the URL space.
		 * @param urlSpec attributes for the URL
		 * @param {int} urlSpec.x width
		 * @param {int} urlSpec.y height
		 * @param {String} urlSpec.file path to the file
		 * @return preview URL
		 * @deprecated used OCA.Files.FileList.generatePreviewUrl instead
		 */
		generatePreviewUrl: function(urlSpec) {
			console.warn('DEPRECATED: please use generatePreviewUrl() from an OCA.Files.FileList instance');
			return OCA.Files.App.fileList.generatePreviewUrl(urlSpec);
		},

		/**
		 * Lazy load preview
		 * @deprecated used OCA.Files.FileList.lazyLoadPreview instead
		 */
		lazyLoadPreview : function(path, mime, ready, width, height, etag) {
			console.warn('DEPRECATED: please use lazyLoadPreview() from an OCA.Files.FileList instance');
			return FileList.lazyLoadPreview({
				path: path,
				mime: mime,
				callback: ready,
				width: width,
				height: height,
				etag: etag
			});
		},

		/**
		 * Initialize the files view
		 */
		initialize: function() {
			Files.bindKeyboardShortcuts(document, $);

			// TODO: move file list related code (upload) to OCA.Files.FileList
			$('#file_action_panel').attr('activeAction', false);

			// drag&drop support using jquery.fileupload
			// TODO use OC.dialogs
			$(document).bind('drop dragover', function (e) {
					e.preventDefault(); // prevent browser from doing anything, if file isn't dropped in dropZone
				});

			// display storage warnings
			setTimeout(Files.displayStorageWarnings, 100);

			// only possible at the moment if user is logged in or the files app is loaded
			if (OC.currentUser && OCA.Files.App) {
				// start on load - we ask the server every 5 minutes
				var func = _.bind(OCA.Files.App.fileList.updateStorageStatistics, OCA.Files.App.fileList);
				var updateStorageStatisticsInterval = 5*60*1000;
				var updateStorageStatisticsIntervalId = setInterval(func, updateStorageStatisticsInterval);

				// TODO: this should also stop when switching to another view
				// Use jquery-visibility to de-/re-activate file stats sync
				if ($.support.pageVisibility) {
					$(document).on({
						'show': function() {
							if (!updateStorageStatisticsIntervalId) {
								updateStorageStatisticsIntervalId = setInterval(func, updateStorageStatisticsInterval);
							}
						},
						'hide': function() {
							clearInterval(updateStorageStatisticsIntervalId);
							updateStorageStatisticsIntervalId = 0;
						}
					});
				}
			}


			$('#webdavurl').on('click touchstart', function () {
				this.focus();
				this.setSelectionRange(0, this.value.length);
			});

			$('#upload').tooltip({placement:'right'});

			//FIXME scroll to and highlight preselected file
			/*
			if (getURLParameter('scrollto')) {
				FileList.scrollTo(getURLParameter('scrollto'));
			}
			*/
		},

		/**
		 * Handles the download and calls the callback function once the download has started
		 * - browser sends download request and adds parameter with a token
		 * - server notices this token and adds a set cookie to the download response
		 * - browser now adds this cookie for the domain
		 * - JS periodically checks for this cookie and then knows when the download has started to call the callback
		 *
		 * @param {string} url download URL
		 * @param {function} callback function to call once the download has started
		 */
		handleDownload: function(url, callback) {
			var randomToken = Math.random().toString(36).substring(2),
				checkForDownloadCookie = function() {
					if (!OC.Util.isCookieSetToValue('ocDownloadStarted', randomToken)){
						return false;
					} else {
						callback();
						return true;
					}
				};

			if (url.indexOf('?') >= 0) {
				url += '&';
			} else {
				url += '?';
			}
			OC.redirect(url + 'downloadStartSecret=' + randomToken);
			OC.Util.waitFor(checkForDownloadCookie, 500);
		}
	};

	Files._updateStorageStatisticsDebounced = _.debounce(Files._updateStorageStatistics, 250);
	OCA.Files.Files = Files;
})();

// TODO: move to FileList
var createDragShadow = function(event) {
	// FIXME: inject file list instance somehow
	/* global FileList, Files */

	//select dragged file
	var isDragSelected = $(event.target).parents('tr').find('td input:first').prop('checked');
	if (!isDragSelected) {
		//select dragged file
		FileList._selectFileEl($(event.target).parents('tr:first'), true, false);
	}

	// do not show drag shadow for too many files
	var selectedFiles = _.first(FileList.getSelectedFiles(), FileList.pageSize());
	selectedFiles = _.sortBy(selectedFiles, FileList._fileInfoCompare);

	if (!isDragSelected && selectedFiles.length === 1) {
		//revert the selection
		FileList._selectFileEl($(event.target).parents('tr:first'), false, false);
	}

	// build dragshadow
	var dragshadow = $('<table class="dragshadow"></table>');
	var tbody = $('<tbody></tbody>');
	dragshadow.append(tbody);

	var dir = FileList.getCurrentDirectory();

	$(selectedFiles).each(function(i,elem) {
		// TODO: refactor this with the table row creation code
		var newtr = $('<tr/>')
			.attr('data-dir', dir)
			.attr('data-file', elem.name)
			.attr('data-origin', elem.origin);
		newtr.append($('<td class="filename" />').text(elem.name).css('background-size', 32));
		newtr.append($('<td class="size" />').text(OC.Util.humanFileSize(elem.size)));
		tbody.append(newtr);
		if (elem.type === 'dir') {
			newtr.find('td.filename')
				.css('background-image', 'url(' + OC.MimeType.getIconUrl('folder') + ')');
		} else {
			var path = dir + '/' + elem.name;
			Files.lazyLoadPreview(path, elem.mimetype, function(previewpath) {
				newtr.find('td.filename')
					.css('background-image', 'url(' + previewpath + ')');
			}, null, null, elem.etag);
		}
	});

	return dragshadow;
};

//options for file drag/drop
//start&stop handlers needs some cleaning up
// TODO: move to FileList class
var dragOptions={
	revert: 'invalid',
	revertDuration: 300,
	opacity: 0.7,
	appendTo: 'body',
	cursorAt: { left: 24, top: 18 },
	helper: createDragShadow,
	cursor: 'move',

	start: function(event, ui){
		var $selectedFiles = $('td.filename input:checkbox:checked');
		if (!$selectedFiles.length) {
			$selectedFiles = $(this);
		}
		$selectedFiles.closest('tr').addClass('animate-opacity dragging');
		$selectedFiles.closest('tr').filter('.ui-droppable').droppable( 'disable' );
		// Show breadcrumbs menu
		$('.crumbmenu').addClass('canDropChildren');

	},
	stop: function(event, ui) {
		var $selectedFiles = $('td.filename input:checkbox:checked');
		if (!$selectedFiles.length) {
			$selectedFiles = $(this);
		}

		var $tr = $selectedFiles.closest('tr');
		$tr.removeClass('dragging');
		$tr.filter('.ui-droppable').droppable( 'enable' );

		setTimeout(function() {
			$tr.removeClass('animate-opacity');
		}, 300);
		// Hide breadcrumbs menu
		$('.crumbmenu').removeClass('canDropChildren');
	},
	drag: function(event, ui) {
		var scrollingArea = FileList.$container;
		var currentScrollTop = $(scrollingArea).scrollTop();
		var scrollArea = Math.min(Math.floor($(window).innerHeight() / 2), 100);

		var bottom = $(window).innerHeight() - scrollArea;
		var top = $(window).scrollTop() + scrollArea;
		if (event.pageY < top) {
			$('html, body').animate({

				scrollTop: $(scrollingArea).scrollTop(currentScrollTop - 10)
			}, 400);

		} else if (event.pageY > bottom) {
			$('html, body').animate({
				scrollTop: $(scrollingArea).scrollTop(currentScrollTop + 10)
			}, 400);
		}

	}
};
// sane browsers support using the distance option
if ( $('html.ie').length === 0) {
	dragOptions['distance'] = 20;
}

// TODO: move to FileList class
var folderDropOptions = {
	hoverClass: "canDrop",
	drop: function( event, ui ) {
		// don't allow moving a file into a selected folder
		/* global FileList */
		if ($(event.target).parents('tr').find('td input:first').prop('checked') === true) {
			return false;
		}

		var $tr = $(this).closest('tr');
		if (($tr.data('permissions') & OC.PERMISSION_CREATE) === 0) {
			FileList._showPermissionDeniedNotification();
			return false;
		}
		var targetPath = FileList.getCurrentDirectory() + '/' + $tr.data('file');

		var files = FileList.getSelectedFiles();
		if (files.length === 0) {
			// single one selected without checkbox?
			files = _.map(ui.helper.find('tr'), function(el) {
				return FileList.elementToFile($(el));
			});
		}

		FileList.move(_.pluck(files, 'name'), targetPath);
	},
	tolerance: 'pointer'
};

// override core's fileDownloadPath (legacy)
function fileDownloadPath(dir, file) {
	return OCA.Files.Files.getDownloadUrl(file, dir);
}

// for backward compatibility
window.Files = OCA.Files.Files;


/**
 * Copyright (c) 2012 Erik Sargent <esthepiking at gmail dot com>
 * This file is licensed under the Affero General Public License version 3 or
 * later.
 */
/*****************************
 * Keyboard shortcuts for Files app
 * ctrl/cmd+n: new folder
 * ctrl/cmd+shift+n: new file
 * esc (while new file context menu is open): close menu
 * up/down: select file/folder
 * enter: open file/folder
 * delete/backspace: delete file/folder
 *****************************/
(function(Files) {
	var keys = [];
	var keyCodes = {
		shift: 16,
		n: 78,
		cmdFirefox: 224,
		cmdOpera: 17,
		leftCmdWebKit: 91,
		rightCmdWebKit: 93,
		ctrl: 17,
		esc: 27,
		downArrow: 40,
		upArrow: 38,
		enter: 13,
		del: 46
	};

	function removeA(arr) {
		var what, a = arguments,
			L = a.length,
			ax;
		while (L > 1 && arr.length) {
			what = a[--L];
			while ((ax = arr.indexOf(what)) !== -1) {
				arr.splice(ax, 1);
			}
		}
		return arr;
	}

	function newFile() {
		$("#new").addClass("active");
		$(".popup.popupTop").toggle(true);
		$('#new li[data-type="file"]').trigger('click');
		removeA(keys, keyCodes.n);
	}

	function newFolder() {
		$("#new").addClass("active");
		$(".popup.popupTop").toggle(true);
		$('#new li[data-type="folder"]').trigger('click');
		removeA(keys, keyCodes.n);
	}

	function esc() {
		$("#controls").trigger('click');
	}

	function down() {
		var select = -1;
		$("#fileList tr").each(function(index) {
			if ($(this).hasClass("mouseOver")) {
				select = index + 1;
				$(this).removeClass("mouseOver");
			}
		});
		if (select === -1) {
			$("#fileList tr:first").addClass("mouseOver");
		} else {
			$("#fileList tr").each(function(index) {
				if (index === select) {
					$(this).addClass("mouseOver");
				}
			});
		}
	}

	function up() {
		var select = -1;
		$("#fileList tr").each(function(index) {
			if ($(this).hasClass("mouseOver")) {
				select = index - 1;
				$(this).removeClass("mouseOver");
			}
		});
		if (select === -1) {
			$("#fileList tr:last").addClass("mouseOver");
		} else {
			$("#fileList tr").each(function(index) {
				if (index === select) {
					$(this).addClass("mouseOver");
				}
			});
		}
	}

	function enter() {
		$("#fileList tr").each(function(index) {
			if ($(this).hasClass("mouseOver")) {
				$(this).removeClass("mouseOver");
				$(this).find("span.nametext").trigger('click');
			}
		});
	}

	function del() {
		$("#fileList tr").each(function(index) {
			if ($(this).hasClass("mouseOver")) {
				$(this).removeClass("mouseOver");
				$(this).find("a.action.delete").trigger('click');
			}
		});
	}

	function rename() {
		$("#fileList tr").each(function(index) {
			if ($(this).hasClass("mouseOver")) {
				$(this).removeClass("mouseOver");
				$(this).find("a[data-action='Rename']").trigger('click');
			}
		});
	}
	Files.bindKeyboardShortcuts = function(document, $) {
		$(document).keydown(function(event) { //check for modifier keys
            if(!$(event.target).is('body')) {
                return;
            }
			var preventDefault = false;
			if ($.inArray(event.keyCode, keys) === -1) {
				keys.push(event.keyCode);
			}
			if (
			$.inArray(keyCodes.n, keys) !== -1 && ($.inArray(keyCodes.cmdFirefox, keys) !== -1 || $.inArray(keyCodes.cmdOpera, keys) !== -1 || $.inArray(keyCodes.leftCmdWebKit, keys) !== -1 || $.inArray(keyCodes.rightCmdWebKit, keys) !== -1 || $.inArray(keyCodes.ctrl, keys) !== -1 || event.ctrlKey)) {
				preventDefault = true; //new file/folder prevent browser from responding
			}
			if (preventDefault) {
				event.preventDefault(); //Prevent web browser from responding
				event.stopPropagation();
				return false;
			}
		});
		$(document).keyup(function(event) {
			// do your event.keyCode checks in here
			if (
			$.inArray(keyCodes.n, keys) !== -1 && ($.inArray(keyCodes.cmdFirefox, keys) !== -1 || $.inArray(keyCodes.cmdOpera, keys) !== -1 || $.inArray(keyCodes.leftCmdWebKit, keys) !== -1 || $.inArray(keyCodes.rightCmdWebKit, keys) !== -1 || $.inArray(keyCodes.ctrl, keys) !== -1 || event.ctrlKey)) {
				if ($.inArray(keyCodes.shift, keys) !== -1) { //16=shift, New File
					newFile();
				} else { //New Folder
					newFolder();
				}
			} else if ($("#new").hasClass("active") && $.inArray(keyCodes.esc, keys) !== -1) { //close new window
				esc();
			} else if ($.inArray(keyCodes.downArrow, keys) !== -1) { //select file
				down();
			} else if ($.inArray(keyCodes.upArrow, keys) !== -1) { //select file
				up();
			} else if (!$("#new").hasClass("active") && $.inArray(keyCodes.enter, keys) !== -1) { //open file
				enter();
			} else if (!$("#new").hasClass("active") && $.inArray(keyCodes.del, keys) !== -1) { //delete file
				del();
			}
			removeA(keys, event.keyCode);
		});
	};
})((OCA.Files && OCA.Files.Files) || {});


/*
 * Copyright (c) 2014
 *
 * @author Vincent Petry
 * @copyright 2014 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {

	/**
	 * @class OCA.Files.Navigation
	 * @classdesc Navigation control for the files app sidebar.
	 *
	 * @param $el element containing the navigation
	 */
	var Navigation = function($el) {
		this.initialize($el);
	};

	/**
	 * @memberof OCA.Files
	 */
	Navigation.prototype = {

		/**
		 * Currently selected item in the list
		 */
		_activeItem: null,

		/**
		 * Currently selected container
		 */
		$currentContent: null,

		/**
		 * Initializes the navigation from the given container
		 *
		 * @private
		 * @param $el element containing the navigation
		 */
		initialize: function($el) {
			this.$el = $el;
			this._activeItem = null;
			this.$currentContent = null;
			this._setupEvents();
		},

		/**
		 * Setup UI events
		 */
		_setupEvents: function() {
			this.$el.on('click', 'li a', _.bind(this._onClickItem, this));
		},

		/**
		 * Returns the container of the currently active app.
		 *
		 * @return app container
		 */
		getActiveContainer: function() {
			return this.$currentContent;
		},

		/**
		 * Returns the currently active item
		 * 
		 * @return item ID
		 */
		getActiveItem: function() {
			return this._activeItem;
		},

		/**
		 * Switch the currently selected item, mark it as selected and
		 * make the content container visible, if any.
		 *
		 * @param string itemId id of the navigation item to select
		 * @param array options "silent" to not trigger event
		 */
		setActiveItem: function(itemId, options) {
			var oldItemId = this._activeItem;
			if (itemId === this._activeItem) {
				if (!options || !options.silent) {
					this.$el.trigger(
						new $.Event('itemChanged', {itemId: itemId, previousItemId: oldItemId})
					);
				}
				return;
			}
			this.$el.find('li').removeClass('active');
			if (this.$currentContent) {
				this.$currentContent.addClass('hidden');
				this.$currentContent.trigger(jQuery.Event('hide'));
			}
			this._activeItem = itemId;
			this.$el.find('li[data-id=' + itemId + ']').addClass('active');
			this.$currentContent = $('#app-content-' + itemId);
			this.$currentContent.removeClass('hidden');
			if (!options || !options.silent) {
				this.$currentContent.trigger(jQuery.Event('show'));
				this.$el.trigger(
					new $.Event('itemChanged', {itemId: itemId, previousItemId: oldItemId})
				);
			}
		},

		/**
		 * Returns whether a given item exists
		 */
		itemExists: function(itemId) {
			return this.$el.find('li[data-id=' + itemId + ']').length;
		},

		/**
		 * Event handler for when clicking on an item.
		 */
		_onClickItem: function(ev) {
			var $target = $(ev.target);
			var itemId = $target.closest('li').attr('data-id');
			if (!_.isUndefined(itemId)) {
				this.setActiveItem(itemId);
			}
			ev.preventDefault();
		}
	};

	OCA.Files.Navigation = Navigation;

})();


