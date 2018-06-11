/*
 * Copyright (c) 2015 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	if (!OCA.SystemTags) {
		/**
		 * @namespace
		 */
		OCA.SystemTags = {};
	}

	OCA.SystemTags.App = {

		initFileList: function($el) {
			if (this._fileList) {
				return this._fileList;
			}

			this._fileList = new OCA.SystemTags.FileList(
				$el,
				{
					id: 'systemtags',
					scrollContainer: $('#app-content'),
					fileActions: this._createFileActions(),
					config: OCA.Files.App.getFilesConfig()
				}
			);

			this._fileList.appName = t('systemtags', 'Tags');
			return this._fileList;
		},

		removeFileList: function() {
			if (this._fileList) {
				this._fileList.$fileList.empty();
			}
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
				OCA.Files.fileActions.on('setDefault.app-systemtags', this._onActionsUpdated);
				OCA.Files.fileActions.on('registerAction.app-systemtags', this._onActionsUpdated);
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
			if (!this._fileList) {
				return;
			}

			if (ev.action) {
				this._fileList.fileActions.registerAction(ev.action);
			} else if (ev.defaultAction) {
				this._fileList.fileActions.setDefault(
					ev.defaultAction.mime,
					ev.defaultAction.name
				);
			}
		},

		/**
		 * Destroy the app
		 */
		destroy: function() {
			OCA.Files.fileActions.off('setDefault.app-systemtags', this._onActionsUpdated);
			OCA.Files.fileActions.off('registerAction.app-systemtags', this._onActionsUpdated);
			this.removeFileList();
			this._fileList = null;
			delete this._globalActionsInitialized;
		}
	};

})();

$(document).ready(function() {
	$('#app-content-systemtagsfilter').on('show', function(e) {
		OCA.SystemTags.App.initFileList($(e.target));
	});
	$('#app-content-systemtagsfilter').on('hide', function() {
		OCA.SystemTags.App.removeFileList();
	});
});


/*
 * Copyright (c) 2016 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */
(function() {
	/**
	 * @class OCA.SystemTags.FileList
	 * @augments OCA.Files.FileList
	 *
	 * @classdesc SystemTags file list.
	 * Contains a list of files filtered by system tags.
	 *
	 * @param $el container element with existing markup for the #controls
	 * and a table
	 * @param [options] map of options, see other parameters
	 * @param {Array.<string>} [options.systemTagIds] array of system tag ids to
	 * filter by
	 */
	var FileList = function($el, options) {
		this.initialize($el, options);
	};
	FileList.prototype = _.extend({}, OCA.Files.FileList.prototype,
		/** @lends OCA.SystemTags.FileList.prototype */ {
		id: 'systemtagsfilter',
		appName: t('systemtags', 'Tagged files'),

		/**
		 * Array of system tag ids to filter by
		 *
		 * @type Array.<string>
		 */
		_systemTagIds: [],
		_lastUsedTags: [],

		_clientSideSort: true,
		_allowSelection: false,

		_filterField: null,

		/**
		 * @private
		 */
		initialize: function($el, options) {
			OCA.Files.FileList.prototype.initialize.apply(this, arguments);
			if (this.initialized) {
				return;
			}

			if (options && options.systemTagIds) {
				this._systemTagIds = options.systemTagIds;
			}

			OC.Plugins.attach('OCA.SystemTags.FileList', this);

			var $controls = this.$el.find('#controls').empty();

			_.defer(_.bind(this._getLastUsedTags, this));
			this._initFilterField($controls);
		},
		
		destroy: function() {
			this.$filterField.remove();

			OCA.Files.FileList.prototype.destroy.apply(this, arguments);
		},

		_getLastUsedTags: function() {
			var self = this;
			$.ajax({
				type: 'GET',
				url: OC.generateUrl('/apps/systemtags/lastused'),
				success: function (response) {
					self._lastUsedTags = response;
				}
			});
		},

		_initFilterField: function($container) {
			var self = this;
			this.$filterField = $('<input type="hidden" name="tags"/>');
			$container.append(this.$filterField);
			this.$filterField.select2({
				placeholder: t('systemtags', 'Select tags to filter by'),
				allowClear: false,
				multiple: true,
				toggleSelect: true,
				separator: ',',
				query: _.bind(this._queryTagsAutocomplete, this),

				id: function(tag) {
					return tag.id;
				},

				initSelection: function(element, callback) {
					var val = $(element).val().trim();
					if (val) {
						var tagIds = val.split(','),
							tags = [];

						OC.SystemTags.collection.fetch({
							success: function() {
								_.each(tagIds, function(tagId) {
									var tag = OC.SystemTags.collection.get(tagId);
									if (!_.isUndefined(tag)) {
										tags.push(tag.toJSON());
									}
								});

								callback(tags);
							}
						});
					} else {
						callback([]);
					}
				},

				formatResult: function (tag) {
					return OC.SystemTags.getDescriptiveTag(tag);
				},

				formatSelection: function (tag) {
					return OC.SystemTags.getDescriptiveTag(tag)[0].outerHTML;
				},

				sortResults: function(results) {
					results.sort(function(a, b) {
						var aLastUsed = self._lastUsedTags.indexOf(a.id);
						var bLastUsed = self._lastUsedTags.indexOf(b.id);

						if (aLastUsed !== bLastUsed) {
							if (bLastUsed === -1) {
								return -1;
							}
							if (aLastUsed === -1) {
								return 1;
							}
							return aLastUsed < bLastUsed ? -1 : 1;
						}

						// Both not found
						return OC.Util.naturalSortCompare(a.name, b.name);
					});
					return results;
				},

				escapeMarkup: function(m) {
					// prevent double markup escape
					return m;
				},
				formatNoMatches: function() {
					return t('systemtags', 'No tags found');
				}
			});
			this.$filterField.on('change', _.bind(this._onTagsChanged, this));
			return this.$filterField;
		},

		/**
		 * Autocomplete function for dropdown results
		 *
		 * @param {Object} query select2 query object
		 */
		_queryTagsAutocomplete: function(query) {
			OC.SystemTags.collection.fetch({
				success: function() {
					var results = OC.SystemTags.collection.filterByName(query.term);

					query.callback({
						results: _.invoke(results, 'toJSON')
					});
				}
			});
		},

		/**
		 * Event handler for when the URL changed
		 */
		_onUrlChanged: function(e) {
			if (e.dir) {
				var tags = _.filter(e.dir.split('/'), function(val) { return val.trim() !== ''; });
				this.$filterField.select2('val', tags || []);
				this._systemTagIds = tags;
				this.reload();
			}
		},

		_onTagsChanged: function(ev) {
			var val = $(ev.target).val().trim();
			if (val !== '') {
				this._systemTagIds = val.split(',');
			} else {
				this._systemTagIds = [];
			}

			this.$el.trigger(jQuery.Event('changeDirectory', {
				dir: this._systemTagIds.join('/')
			}));
			this.reload();
		},

		updateEmptyContent: function() {
			var dir = this.getCurrentDirectory();
			if (dir === '/') {
				// root has special permissions
				if (!this._systemTagIds.length) {
					// no tags selected
					this.$el.find('#emptycontent').html('<div class="icon-systemtags"></div>' +
						'<h2>' + t('systemtags', 'Please select tags to filter by') + '</h2>');
				} else {
					// tags selected but no results
					this.$el.find('#emptycontent').html('<div class="icon-systemtags"></div>' +
						'<h2>' + t('systemtags', 'No files found for the selected tags') + '</h2>');
				}
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
			// there is only root
			this._setCurrentDir('/', false);

			if (!this._systemTagIds.length) {
				// don't reload
				this.updateEmptyContent();
				this.setFiles([]);
				return $.Deferred().resolve();
			}

			this._selectedFiles = {};
			this._selectionSummary.clear();
			if (this._currentFileModel) {
				this._currentFileModel.off();
			}
			this._currentFileModel = null;
			this.$el.find('.select-all').prop('checked', false);
			this.showMask();
			this._reloadCall = this.filesClient.getFilteredFiles(
				{
					systemTagIds: this._systemTagIds
				},
				{
					properties: this._getWebdavProperties()
				}
			);
			if (this._detailsView) {
				// close sidebar
				this._updateDetailsView(null);
			}
			var callBack = this.reloadCallback.bind(this);
			return this._reloadCall.then(callBack, callBack);
		},

		reloadCallback: function(status, result) {
			if (result) {
				// prepend empty dir info because original handler
				result.unshift({});
			}

			return OCA.Files.FileList.prototype.reloadCallback.call(this, status, result);
		}
	});

	OCA.SystemTags.FileList = FileList;
})();


/*
 * Copyright (c) 2015 Vincent Petry <pvince81@owncloud.com>
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function() {
	OCA.SystemTags = _.extend({}, OCA.SystemTags);
	if (!OCA.SystemTags) {
		/**
		 * @namespace
		 */
		OCA.SystemTags = {};
	}

	/**
	 * @namespace
	 */
	OCA.SystemTags.FilesPlugin = {
		ignoreLists: [
			'files_trashbin',
			'files.public'
		],

		attach: function(fileList) {
			if (this.ignoreLists.indexOf(fileList.id) >= 0) {
				return;
			}

			var systemTagsInfoView = new OCA.SystemTags.SystemTagsInfoView();
			fileList.registerDetailView(systemTagsInfoView);

			_.each(fileList.getRegisteredDetailViews(), function(detailView) {
				if (detailView instanceof OCA.Files.MainFileInfoDetailView) {
					var systemTagsInfoViewToggleView =
						new OCA.SystemTags.SystemTagsInfoViewToggleView({
							systemTagsInfoView: systemTagsInfoView
						});
					systemTagsInfoViewToggleView.render();

					// The toggle view element is detached before the
					// MainFileInfoDetailView is rendered to prevent its event
					// handlers from being removed.
					systemTagsInfoViewToggleView.listenTo(detailView, 'pre-render', function() {
						systemTagsInfoViewToggleView.$el.detach();
					});
					systemTagsInfoViewToggleView.listenTo(detailView, 'post-render', function() {
						detailView.$el.find('.file-details').append(systemTagsInfoViewToggleView.$el);
					});

					return;
				}
			});
		}
	};

})();

OC.Plugins.register('OCA.Files.FileList', OCA.SystemTags.FilesPlugin);



/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

(function(OCA) {

	function modelToSelection(model) {
		var data = model.toJSON();
		if (!OC.isUserAdmin() && !data.canAssign) {
			data.locked = true;
		}
		return data;
	}

	/**
	 * @class OCA.SystemTags.SystemTagsInfoView
	 * @classdesc
	 *
	 * Displays a file's system tags
	 *
	 */
	var SystemTagsInfoView = OCA.Files.DetailFileInfoView.extend(
		/** @lends OCA.SystemTags.SystemTagsInfoView.prototype */ {

		_rendered: false,

		className: 'systemTagsInfoView hidden',

		/**
		 * @type OC.SystemTags.SystemTagsInputField
		 */
		_inputView: null,

		initialize: function(options) {
			var self = this;
			options = options || {};

			this._inputView = new OC.SystemTags.SystemTagsInputField({
				multiple: true,
				allowActions: true,
				allowCreate: true,
				isAdmin: OC.isUserAdmin(),
				initSelection: function(element, callback) {
					callback(self.selectedTagsCollection.map(modelToSelection));
				}
			});

			this.selectedTagsCollection = new OC.SystemTags.SystemTagsMappingCollection([], {objectType: 'files'});

			this._inputView.collection.on('change:name', this._onTagRenamedGlobally, this);
			this._inputView.collection.on('remove', this._onTagDeletedGlobally, this);

			this._inputView.on('select', this._onSelectTag, this);
			this._inputView.on('deselect', this._onDeselectTag, this);
		},

		/**
		 * Event handler whenever a tag was selected
		 */
		_onSelectTag: function(tag) {
			// create a mapping entry for this tag
			this.selectedTagsCollection.create(tag.toJSON());
		},

		/**
		 * Event handler whenever a tag gets deselected.
		 * Removes the selected tag from the mapping collection.
		 *
		 * @param {string} tagId tag id
		 */
		_onDeselectTag: function(tagId) {
			this.selectedTagsCollection.get(tagId).destroy();
		},

		/**
		 * Event handler whenever a tag was renamed globally.
		 *
		 * This will automatically adjust the tag mapping collection to
		 * container the new name.
		 *
		 * @param {OC.Backbone.Model} changedTag tag model that has changed
		 */
		_onTagRenamedGlobally: function(changedTag) {
			// also rename it in the selection, if applicable
			var selectedTagMapping = this.selectedTagsCollection.get(changedTag.id);
			if (selectedTagMapping) {
				selectedTagMapping.set(changedTag.toJSON());
			}
		},

		/**
		 * Event handler whenever a tag was deleted globally.
		 *
		 * This will automatically adjust the tag mapping collection to
		 * container the new name.
		 *
		 * @param {OC.Backbone.Model} tagId tag model that has changed
		 */
		_onTagDeletedGlobally: function(tagId) {
			// also rename it in the selection, if applicable
			this.selectedTagsCollection.remove(tagId);
		},

		setFileInfo: function(fileInfo) {
			var self = this;
			if (!this._rendered) {
				this.render();
			}

			if (fileInfo) {
				this.selectedTagsCollection.setObjectId(fileInfo.id);
				this.selectedTagsCollection.fetch({
					success: function(collection) {
						collection.fetched = true;

						var appliedTags = collection.map(modelToSelection);
						self._inputView.setData(appliedTags);

						if (appliedTags.length !== 0) {
							self.show();
						} else {
							self.hide();
						}
					}
				});
			}

			this.hide();
		},

		/**
		 * Renders this details view
		 */
		render: function() {
			var self = this;

			this.$el.append(this._inputView.$el);
			this._inputView.render();
		},

		isVisible: function() {
			return !this.$el.hasClass('hidden');
		},

		show: function() {
			this.$el.removeClass('hidden');
		},

		hide: function() {
			this.$el.addClass('hidden');
		},

		openDropdown: function() {
			this.$el.find('.systemTagsInputField').select2('open');
		},

		remove: function() {
			this._inputView.remove();
		}
	});

	OCA.SystemTags.SystemTagsInfoView = SystemTagsInfoView;

})(OCA);



/**
 *
 * @copyright Copyright (c) 2017, Daniel Calviño Sánchez (danxuliu@gmail.com)
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

(function(OCA) {

	var TEMPLATE =
		'<span class="icon icon-tag"/>' + t('systemtags', 'Tags');

	/**
	 * @class OCA.SystemTags.SystemTagsInfoViewToggleView
	 * @classdesc
	 *
	 * View to toggle the visibility of a SystemTagsInfoView.
	 *
	 * This toggle view must be explicitly rendered before it is used.
	 */
	var SystemTagsInfoViewToggleView = OC.Backbone.View.extend(
		/** @lends OC.Backbone.View.prototype */ {

		tagName: 'span',

		className: 'tag-label',

		events: {
			'click': 'click'
		},

		/**
		 * @type OCA.SystemTags.SystemTagsInfoView
		 */
		_systemTagsInfoView: null,

		template: function(data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(data);
		},

		/**
		 * Initialize this toggle view.
		 *
		 * The options must provide a systemTagsInfoView parameter that
		 * references the SystemTagsInfoView to associate to this toggle view.
		 */
		initialize: function(options) {
			var self = this;
			options = options || {};

			this._systemTagsInfoView = options.systemTagsInfoView;
			if (!this._systemTagsInfoView) {
				throw 'Missing required parameter "systemTagsInfoView"';
			}
		},

		/**
		 * Toggles the visibility of the associated SystemTagsInfoView.
		 *
		 * When the systemTagsInfoView is shown its dropdown is also opened.
		 */
		click: function() {
			if (this._systemTagsInfoView.isVisible()) {
				this._systemTagsInfoView.hide();
			} else {
				this._systemTagsInfoView.show();
				this._systemTagsInfoView.openDropdown();
			}
		},

		/**
		 * Renders this toggle view.
		 *
		 * @return OCA.SystemTags.SystemTagsInfoViewToggleView this object.
		 */
		render: function() {
			this.$el.html(this.template());

			return this;
		},

	});

	OCA.SystemTags.SystemTagsInfoViewToggleView = SystemTagsInfoViewToggleView;

})(OCA);


