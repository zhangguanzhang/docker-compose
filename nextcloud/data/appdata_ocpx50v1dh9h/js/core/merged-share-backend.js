/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* global moment, oc_appconfig, oc_config */

(function() {
	if (!OC.Share) {
		OC.Share = {};
		OC.Share.Types = {};
	}

	// FIXME: the config model should populate its own model attributes based on
	// the old DOM-based config
	var ShareConfigModel = OC.Backbone.Model.extend({
		defaults: {
			publicUploadEnabled: false,
			enforcePasswordForPublicLink: oc_appconfig.core.enforcePasswordForPublicLink,
			enableLinkPasswordByDefault: oc_appconfig.core.enableLinkPasswordByDefault,
			isDefaultExpireDateEnforced: oc_appconfig.core.defaultExpireDateEnforced === true,
			isDefaultExpireDateEnabled: oc_appconfig.core.defaultExpireDateEnabled === true,
			isRemoteShareAllowed: oc_appconfig.core.remoteShareAllowed,
			isMailShareAllowed: oc_appconfig.shareByMailEnabled !== undefined,
			defaultExpireDate: oc_appconfig.core.defaultExpireDate,
			isResharingAllowed: oc_appconfig.core.resharingAllowed,
			isPasswordForMailSharesRequired: (oc_appconfig.shareByMail === undefined) ? false : oc_appconfig.shareByMail.enforcePasswordProtection,
			allowGroupSharing: oc_appconfig.core.allowGroupSharing
		},

		/**
		 * @returns {boolean}
		 * @deprecated here for legacy reasons - will always return true
		 */
		areAvatarsEnabled: function() {
			return true;
		},

		/**
		 * @returns {boolean}
		 */
		isPublicUploadEnabled: function() {
			var publicUploadEnabled = $('#filestable').data('allow-public-upload');
			return publicUploadEnabled === 'yes';
		},

		/**
		 * @returns {boolean}
		 */
		isShareWithLinkAllowed: function() {
			return $('#allowShareWithLink').val() === 'yes';
		},

		/**
		 * @returns {string}
		 */
		getFederatedShareDocLink: function() {
			return oc_appconfig.core.federatedCloudShareDoc;
		},

		getDefaultExpirationDateString: function () {
			var expireDateString = '';
			if (this.get('isDefaultExpireDateEnabled')) {
				var date = moment.utc();
				var expireAfterDays = this.get('defaultExpireDate');
				date.add(expireAfterDays, 'days');
				expireDateString = date.format('YYYY-MM-DD 00:00:00');
			}
			return expireDateString;
		}
	});


	OC.Share.ShareConfigModel = ShareConfigModel;
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
	if(!OC.Share) {
		OC.Share = {};
		OC.Share.Types = {};
	}

	/**
	 * @typedef {object} OC.Share.Types.LinkShareInfo
	 * @property {bool} isLinkShare
	 * @property {string} token
	 * @property {string|null} password
	 * @property {string} link
	 * @property {number} permissions
	 * @property {Date} expiration
	 * @property {number} stime share time
	 */

	/**
	 * @typedef {object} OC.Share.Types.Reshare
	 * @property {string} uid_owner
	 * @property {number} share_type
	 * @property {string} share_with
	 * @property {string} displayname_owner
	 * @property {number} permissions
	 */

	/**
	 * @typedef {object} OC.Share.Types.ShareInfo
	 * @property {number} share_type
	 * @property {number} permissions
	 * @property {number} file_source optional
	 * @property {number} item_source
	 * @property {string} token
	 * @property {string} share_with
	 * @property {string} share_with_displayname
	 * @property {string} mail_send
	 * @property {Date} expiration optional?
	 * @property {number} stime optional?
	 * @property {string} uid_owner
	 * @property {string} displayname_owner
	 */

	/**
	 * @typedef {object} OC.Share.Types.ShareItemInfo
	 * @property {OC.Share.Types.Reshare} reshare
	 * @property {OC.Share.Types.ShareInfo[]} shares
	 * @property {OC.Share.Types.LinkShareInfo|undefined} linkShare
	 */

	/**
	 * These properties are sometimes returned by the server as strings instead
	 * of integers, so we need to convert them accordingly...
	 */
	var SHARE_RESPONSE_INT_PROPS = [
		'id', 'file_parent', 'mail_send', 'file_source', 'item_source', 'permissions',
		'storage', 'share_type', 'parent', 'stime'
	];

	/**
	 * @class OCA.Share.ShareItemModel
	 * @classdesc
	 *
	 * Represents the GUI of the share dialogue
	 *
	 * // FIXME: use OC Share API once #17143 is done
	 *
	 * // TODO: this really should be a collection of share item models instead,
	 * where the link share is one of them
	 */
	var ShareItemModel = OC.Backbone.Model.extend({
		/**
		 * @type share id of the link share, if applicable
		 */
		_linkShareId: null,

		initialize: function(attributes, options) {
			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			}
			if(!_.isUndefined(options.fileInfoModel)) {
				/** @type {OC.Files.FileInfo} **/
				this.fileInfoModel = options.fileInfoModel;
			}

			_.bindAll(this, 'addShare');
		},

		defaults: {
			allowPublicUploadStatus: false,
			permissions: 0,
			linkShare: {}
		},

		/**
		 * Saves the current link share information.
		 *
		 * This will trigger an ajax call and, if successful, refetch the model
		 * afterwards. Callbacks "success", "error" and "complete" can be given
		 * in the options object; "success" is called after a successful save
		 * once the model is refetch, "error" is called after a failed save, and
		 * "complete" is called both after a successful save and after a failed
		 * save. Note that "complete" is called before "success" and "error" are
		 * called (unlike in jQuery, in which it is called after them); this
		 * ensures that "complete" is called even if refetching the model fails.
		 *
		 * TODO: this should be a separate model
		 */
		saveLinkShare: function(attributes, options) {
			options = options || {};
			attributes = _.extend({}, attributes);

			var shareId = null;
			var call;

			// oh yeah...
			if (attributes.expiration) {
				attributes.expireDate = attributes.expiration;
				delete attributes.expiration;
			}

			if (this.get('linkShare') && this.get('linkShare').isLinkShare) {
				shareId = this.get('linkShare').id;

				// note: update can only update a single value at a time
				call = this.updateShare(shareId, attributes, options);
			} else {
				attributes = _.defaults(attributes, {
					password: '',
					passwordChanged: false,
					permissions: OC.PERMISSION_READ,
					expireDate: this.configModel.getDefaultExpirationDateString(),
					shareType: OC.Share.SHARE_TYPE_LINK
				});

				call = this.addShare(attributes, options);
			}

			return call;
		},

		removeLinkShare: function() {
			if (this.get('linkShare')) {
				return this.removeShare(this.get('linkShare').id);
			}
		},

		addShare: function(attributes, options) {
			var shareType = attributes.shareType;
			attributes = _.extend({}, attributes);

			// Default permissions are Edit (CRUD) and Share
			// Check if these permissions are possible
			var permissions = OC.PERMISSION_READ;
			if (this.updatePermissionPossible()) {
				permissions = permissions | OC.PERMISSION_UPDATE;
			}
			if (this.createPermissionPossible()) {
				permissions = permissions | OC.PERMISSION_CREATE;
			}
			if (this.deletePermissionPossible()) {
				permissions = permissions | OC.PERMISSION_DELETE;
			}
			if (this.configModel.get('isResharingAllowed') && (this.sharePermissionPossible())) {
				permissions = permissions | OC.PERMISSION_SHARE;
			}

			attributes.permissions = permissions;
			if (_.isUndefined(attributes.path)) {
				attributes.path = this.fileInfoModel.getFullPath();
			}

			return this._addOrUpdateShare({
				type: 'POST',
				url: this._getUrl('shares'),
				data: attributes,
				dataType: 'json'
			}, options);
		},

		updateShare: function(shareId, attrs, options) {
			return this._addOrUpdateShare({
				type: 'PUT',
				url: this._getUrl('shares/' + encodeURIComponent(shareId)),
				data: attrs,
				dataType: 'json'
			}, options);
		},

		_addOrUpdateShare: function(ajaxSettings, options) {
			var self = this;
			options = options || {};

			return $.ajax(
				ajaxSettings
			).always(function() {
				if (_.isFunction(options.complete)) {
					options.complete(self);
				}
			}).done(function() {
				self.fetch().done(function() {
					if (_.isFunction(options.success)) {
						options.success(self);
					}
				});
			}).fail(function(xhr) {
				var msg = t('core', 'Error');
				var result = xhr.responseJSON;
				if (result && result.ocs && result.ocs.meta) {
					msg = result.ocs.meta.message;
				}

				if (_.isFunction(options.error)) {
					options.error(self, msg);
				} else {
					OC.dialogs.alert(msg, t('core', 'Error while sharing'));
				}
			});
		},

		/**
		 * Deletes the share with the given id
		 *
		 * @param {int} shareId share id
		 * @return {jQuery}
		 */
		removeShare: function(shareId, options) {
			var self = this;
			options = options || {};
			return $.ajax({
				type: 'DELETE',
				url: this._getUrl('shares/' + encodeURIComponent(shareId)),
			}).done(function() {
				self.fetch({
					success: function() {
						if (_.isFunction(options.success)) {
							options.success(self);
						}
					}
				});
			}).fail(function(xhr) {
				var msg = t('core', 'Error');
				var result = xhr.responseJSON;
				if (result.ocs && result.ocs.meta) {
					msg = result.ocs.meta.message;
				}

				if (_.isFunction(options.error)) {
					options.error(self, msg);
				} else {
					OC.dialogs.alert(msg, t('core', 'Error removing share'));
				}
			});
		},

		/**
		 * @returns {boolean}
		 */
		isPublicUploadAllowed: function() {
			return this.get('allowPublicUploadStatus');
		},

		isPublicEditingAllowed: function() {
			return this.get('allowPublicEditingStatus');
		},

		/**
		 * @returns {boolean}
		 */
		isHideFileListSet: function() {
			return this.get('hideFileListStatus');
		},

		/**
		 * @returns {boolean}
		 */
		isFolder: function() {
			return this.get('itemType') === 'folder';
		},

		/**
		 * @returns {boolean}
		 */
		isFile: function() {
			return this.get('itemType') === 'file';
		},

		/**
		 * whether this item has reshare information
		 * @returns {boolean}
		 */
		hasReshare: function() {
			var reshare = this.get('reshare');
			return _.isObject(reshare) && !_.isUndefined(reshare.uid_owner);
		},

		/**
		 * whether this item has user share information
		 * @returns {boolean}
		 */
		hasUserShares: function() {
			return this.getSharesWithCurrentItem().length > 0;
		},

		/**
		 * Returns whether this item has a link share
		 *
		 * @return {bool} true if a link share exists, false otherwise
		 */
		hasLinkShare: function() {
			var linkShare = this.get('linkShare');
			if (linkShare && linkShare.isLinkShare) {
				return true;
			}
			return false;
		},

		/**
		 * @returns {string}
		 */
		getReshareOwner: function() {
			return this.get('reshare').uid_owner;
		},

		/**
		 * @returns {string}
		 */
		getReshareOwnerDisplayname: function() {
			return this.get('reshare').displayname_owner;
		},

		/**
		 * @returns {string}
		 */
		getReshareWith: function() {
			return this.get('reshare').share_with;
		},

		/**
		 * @returns {string}
		 */
		getReshareWithDisplayName: function() {
			var reshare = this.get('reshare');
			return reshare.share_with_displayname || reshare.share_with;
		},

		/**
		 * @returns {number}
		 */
		getReshareType: function() {
			return this.get('reshare').share_type;
		},

		getExpireDate: function(shareIndex) {
			return this._shareExpireDate(shareIndex);
		},

		/**
		 * Returns all share entries that only apply to the current item
		 * (file/folder)
		 *
		 * @return {Array.<OC.Share.Types.ShareInfo>}
		 */
		getSharesWithCurrentItem: function() {
			var shares = this.get('shares') || [];
			var fileId = this.fileInfoModel.get('id');
			return _.filter(shares, function(share) {
				return share.item_source === fileId;
			});
		},

		/**
		 * @param shareIndex
		 * @returns {string}
		 */
		getShareWith: function(shareIndex) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return share.share_with;
		},

		/**
		 * @param shareIndex
		 * @returns {string}
		 */
		getShareWithDisplayName: function(shareIndex) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return share.share_with_displayname;
		},

		/**
		 * @param shareIndex
		 * @returns {string}
		 */
		getSharedBy: function(shareIndex) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return share.uid_owner;
		},

		/**
		 * @param shareIndex
		 * @returns {string}
		 */
		getSharedByDisplayName: function(shareIndex) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return share.displayname_owner;
		},

		/**
		 * returns the array index of a sharee for a provided shareId
		 *
		 * @param shareId
		 * @returns {number}
		 */
		findShareWithIndex: function(shareId) {
			var shares = this.get('shares');
			if(!_.isArray(shares)) {
				throw "Unknown Share";
			}
			for(var i = 0; i < shares.length; i++) {
				var shareWith = shares[i];
				if(shareWith.id === shareId) {
					return i;
				}
			}
			throw "Unknown Sharee";
		},

		getShareType: function(shareIndex) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return share.share_type;
		},

		/**
		 * whether a share from shares has the requested permission
		 *
		 * @param {number} shareIndex
		 * @param {number} permission
		 * @returns {boolean}
		 * @private
		 */
		_shareHasPermission: function(shareIndex, permission) {
			/** @type OC.Share.Types.ShareInfo **/
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			return (share.permissions & permission) === permission;
		},


		_shareExpireDate: function(shareIndex) {
			var share = this.get('shares')[shareIndex];
			if(!_.isObject(share)) {
				throw "Unknown Share";
			}
			var date2 = share.expiration;
			return date2;
		},

		/**
		 * @return {int}
		 */
		getPermissions: function() {
			return this.get('permissions');
		},

		/**
		 * @returns {boolean}
		 */
		sharePermissionPossible: function() {
			return (this.get('permissions') & OC.PERMISSION_SHARE) === OC.PERMISSION_SHARE;
		},

		/**
		 * @param {number} shareIndex
		 * @returns {boolean}
		 */
		hasSharePermission: function(shareIndex) {
			return this._shareHasPermission(shareIndex, OC.PERMISSION_SHARE);
		},

		/**
		 * @returns {boolean}
		 */
		createPermissionPossible: function() {
			return (this.get('permissions') & OC.PERMISSION_CREATE) === OC.PERMISSION_CREATE;
		},

		/**
		 * @param {number} shareIndex
		 * @returns {boolean}
		 */
		hasCreatePermission: function(shareIndex) {
			return this._shareHasPermission(shareIndex, OC.PERMISSION_CREATE);
		},

		/**
		 * @returns {boolean}
		 */
		updatePermissionPossible: function() {
			return (this.get('permissions') & OC.PERMISSION_UPDATE) === OC.PERMISSION_UPDATE;
		},

		/**
		 * @param {number} shareIndex
		 * @returns {boolean}
		 */
		hasUpdatePermission: function(shareIndex) {
			return this._shareHasPermission(shareIndex, OC.PERMISSION_UPDATE);
		},

		/**
		 * @returns {boolean}
		 */
		deletePermissionPossible: function() {
			return (this.get('permissions') & OC.PERMISSION_DELETE) === OC.PERMISSION_DELETE;
		},

		/**
		 * @param {number} shareIndex
		 * @returns {boolean}
		 */
		hasDeletePermission: function(shareIndex) {
			return this._shareHasPermission(shareIndex, OC.PERMISSION_DELETE);
		},

		hasReadPermission: function(shareIndex) {
			return this._shareHasPermission(shareIndex, OC.PERMISSION_READ);
		},

		/**
		 * @returns {boolean}
		 */
		editPermissionPossible: function() {
			return    this.createPermissionPossible()
				   || this.updatePermissionPossible()
				   || this.deletePermissionPossible();
		},

		/**
		 * @returns {boolean}
		 */
		hasEditPermission: function(shareIndex) {
			return    this.hasCreatePermission(shareIndex)
				   || this.hasUpdatePermission(shareIndex)
				   || this.hasDeletePermission(shareIndex);
		},

		/**
		 * @returns {int}
		 */
		linkSharePermissions: function() {
			if (!this.hasLinkShare()) {
				return -1;
			} else {
				return this.get('linkShare').permissions;
			}
		},

		_getUrl: function(base, params) {
			params = _.extend({format: 'json'}, params || {});
			return OC.linkToOCS('apps/files_sharing/api/v1', 2) + base + '?' + OC.buildQueryString(params);
		},

		_fetchShares: function() {
			var path = this.fileInfoModel.getFullPath();
			return $.ajax({
				type: 'GET',
				url: this._getUrl('shares', {path: path, reshares: true})
			});
		},

		_fetchReshare: function() {
			// only fetch original share once
			if (!this._reshareFetched) {
				var path = this.fileInfoModel.getFullPath();
				this._reshareFetched = true;
				return $.ajax({
					type: 'GET',
					url: this._getUrl('shares', {path: path, shared_with_me: true})
				});
			} else {
				return $.Deferred().resolve([{
					ocs: {
						data: [this.get('reshare')]
					}
				}]);
			}
		},

		/**
		 * Group reshares into a single super share element.
		 * Does this by finding the most precise share and
		 * combines the permissions to be the most permissive.
		 *
		 * @param {Array} reshares
		 * @return {Object} reshare
		 */
		_groupReshares: function(reshares) {
			if (!reshares || !reshares.length) {
				return false;
			}

			var superShare = reshares.shift();
			var combinedPermissions = superShare.permissions;
			_.each(reshares, function(reshare) {
				// use share have higher priority than group share
				if (reshare.share_type === OC.Share.SHARE_TYPE_USER && superShare.share_type === OC.Share.SHARE_TYPE_GROUP) {
					superShare = reshare;
				}
				combinedPermissions |= reshare.permissions;
			});

			superShare.permissions = combinedPermissions;
			return superShare;
		},

		fetch: function(options) {
			var model = this;
			this.trigger('request', this);

			var deferred = $.when(
				this._fetchShares(),
				this._fetchReshare()
			);
			deferred.done(function(data1, data2) {
				model.trigger('sync', 'GET', this);
				var sharesMap = {};
				_.each(data1[0].ocs.data, function(shareItem) {
					sharesMap[shareItem.id] = shareItem;
				});

				var reshare = false;
				if (data2[0].ocs.data.length) {
					reshare = model._groupReshares(data2[0].ocs.data);
				}

				model.set(model.parse({
					shares: sharesMap,
					reshare: reshare
				}));

				if(!_.isUndefined(options) && _.isFunction(options.success)) {
					options.success();
				}
			});

			return deferred;
		},

		/**
		 * Updates OC.Share.itemShares and OC.Share.statuses.
		 *
		 * This is required in case the user navigates away and comes back,
		 * the share statuses from the old arrays are still used to fill in the icons
		 * in the file list.
		 */
		_legacyFillCurrentShares: function(shares) {
			var fileId = this.fileInfoModel.get('id');
			if (!shares || !shares.length) {
				delete OC.Share.statuses[fileId];
				OC.Share.currentShares = {};
				OC.Share.itemShares = [];
				return;
			}

			var currentShareStatus = OC.Share.statuses[fileId];
			if (!currentShareStatus) {
				currentShareStatus = {link: false};
				OC.Share.statuses[fileId] = currentShareStatus;
			}
			currentShareStatus.link = false;

			OC.Share.currentShares = {};
			OC.Share.itemShares = [];
			_.each(shares,
				/**
				 * @param {OC.Share.Types.ShareInfo} share
				 */
				function(share) {
					if (share.share_type === OC.Share.SHARE_TYPE_LINK) {
						OC.Share.itemShares[share.share_type] = true;
						currentShareStatus.link = true;
					} else {
						if (!OC.Share.itemShares[share.share_type]) {
							OC.Share.itemShares[share.share_type] = [];
						}
						OC.Share.itemShares[share.share_type].push(share.share_with);
					}
				}
			);
		},

		parse: function(data) {
			if(data === false) {
				console.warn('no data was returned');
				this.trigger('fetchError');
				return {};
			}

			var permissions = this.get('possiblePermissions');
			if(!_.isUndefined(data.reshare) && !_.isUndefined(data.reshare.permissions) && data.reshare.uid_owner !== OC.currentUser) {
				permissions = permissions & data.reshare.permissions;
			}

			var allowPublicUploadStatus = false;
			if(!_.isUndefined(data.shares)) {
				$.each(data.shares, function (key, value) {
					if (value.share_type === OC.Share.SHARE_TYPE_LINK) {
						allowPublicUploadStatus = (value.permissions & OC.PERMISSION_CREATE) ? true : false;
						return true;
					}
				});
			}

			var allowPublicEditingStatus = true;
			if(!_.isUndefined(data.shares)) {
				$.each(data.shares, function (key, value) {
					if (value.share_type === OC.Share.SHARE_TYPE_LINK) {
						allowPublicEditingStatus = (value.permissions & OC.PERMISSION_UPDATE) ? true : false;
						return true;
					}
				});
			}


			var hideFileListStatus = false;
			if(!_.isUndefined(data.shares)) {
				$.each(data.shares, function (key, value) {
					if (value.share_type === OC.Share.SHARE_TYPE_LINK) {
						hideFileListStatus = (value.permissions & OC.PERMISSION_READ) ? false : true;
						return true;
					}
				});
			}

			/** @type {OC.Share.Types.ShareInfo[]} **/
			var shares = _.map(data.shares, function(share) {
				// properly parse some values because sometimes the server
				// returns integers as string...
				var i;
				for (i = 0; i < SHARE_RESPONSE_INT_PROPS.length; i++) {
					var prop = SHARE_RESPONSE_INT_PROPS[i];
					if (!_.isUndefined(share[prop])) {
						share[prop] = parseInt(share[prop], 10);
					}
				}
				return share;
			});

			this._legacyFillCurrentShares(shares);

			var linkShare = { isLinkShare: false };
			// filter out the share by link
			shares = _.reject(shares,
				/**
				 * @param {OC.Share.Types.ShareInfo} share
				 */
				function(share) {
					var isShareLink =
						share.share_type === OC.Share.SHARE_TYPE_LINK
						&& (   share.file_source === this.get('itemSource')
						|| share.item_source === this.get('itemSource'));

					if (isShareLink) {
						/*
						 * Ignore reshared link shares for now
						 * FIXME: Find a way to display properly
						 */
						if (share.uid_owner !== OC.currentUser) {
							return;
						}

						var link = window.location.protocol + '//' + window.location.host;
						if (!share.token) {
							// pre-token link
							var fullPath = this.fileInfoModel.get('path') + '/' +
								this.fileInfoModel.get('name');
							var location = '/' + OC.currentUser + '/files' + fullPath;
							var type = this.fileInfoModel.isDirectory() ? 'folder' : 'file';
							link += OC.linkTo('', 'public.php') + '?service=files&' +
								type + '=' + encodeURIComponent(location);
						} else {
							link += OC.generateUrl('/s/') + share.token;
						}
						linkShare = {
							isLinkShare: true,
							id: share.id,
							token: share.token,
							password: share.share_with,
							link: link,
							permissions: share.permissions,
							// currently expiration is only effective for link shares.
							expiration: share.expiration,
							stime: share.stime
						};

						return share;
					}
				},
				this
			);

			return {
				reshare: data.reshare,
				shares: shares,
				linkShare: linkShare,
				permissions: permissions,
				allowPublicUploadStatus: allowPublicUploadStatus,
				allowPublicEditingStatus: allowPublicEditingStatus,
				hideFileListStatus: hideFileListStatus
			};
		},

		/**
		 * Parses a string to an valid integer (unix timestamp)
		 * @param time
		 * @returns {*}
		 * @internal Only used to work around a bug in the backend
		 */
		_parseTime: function(time) {
			if (_.isString(time)) {
				// skip empty strings and hex values
				if (time === '' || (time.length > 1 && time[0] === '0' && time[1] === 'x')) {
					return null;
				}
				time = parseInt(time, 10);
				if(isNaN(time)) {
					time = null;
				}
			}
			return time;
		},

		/**
		 * Returns a list of share types from the existing shares.
		 *
		 * @return {Array.<int>} array of share types
		 */
		getShareTypes: function() {
			var result;
			result = _.pluck(this.getSharesWithCurrentItem(), 'share_type');
			if (this.hasLinkShare()) {
				result.push(OC.Share.SHARE_TYPE_LINK);
			}
			return _.uniq(result);
		}
	});

	OC.Share.ShareItemModel = ShareItemModel;
})();


/**
 * @copyright 2017, Roeland Jago Douma <roeland@famdouma.nl>
 *
 * @author Roeland Jago Douma <roeland@famdouma.nl>
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

(function() {
	if (!OC.Share) {
		OC.Share = {};
	}

	OC.Share.Social = {};

	var SocialModel = OC.Backbone.Model.extend({
		defaults: {
			/** used for sorting social buttons */
			key: null,
			/** url to open, {{reference}} will be replaced with the link */
			url: null,
			/** Name to show in the tooltip */
			name: null,
			/** Icon class to display */
			iconClass: null,
			/** Open in new windows */
			newWindow: true
		}
	});

	OC.Share.Social.Model = SocialModel;

	var SocialCollection = OC.Backbone.Collection.extend({
		model: OC.Share.Social.Model,

		comparator: 'key'
	});


	OC.Share.Social.Collection = new SocialCollection;
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

/* globals Handlebars */

(function() {
	if (!OC.Share) {
		OC.Share = {};
	}

	var TEMPLATE =
		'<span class="reshare">' +
		'    <div class="avatar" data-userName="{{reshareOwner}}"></div>' +
		'    {{sharedByText}}' +
		'</span><br/>'
		;

	/**
	 * @class OCA.Share.ShareDialogView
	 * @member {OC.Share.ShareItemModel} model
	 * @member {jQuery} $el
	 * @memberof OCA.Sharing
	 * @classdesc
	 *
	 * Represents the GUI of the share dialogue
	 *
	 */
	var ShareDialogResharerInfoView = OC.Backbone.View.extend({
		/** @type {string} **/
		id: 'shareDialogResharerInfo',

		/** @type {string} **/
		tagName: 'div',

		/** @type {string} **/
		className: 'reshare',

		/** @type {OC.Share.ShareConfigModel} **/
		configModel: undefined,

		/** @type {Function} **/
		_template: undefined,

		initialize: function(options) {
			var view = this;

			this.model.on('change:reshare', function() {
				view.render();
			});

			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			} else {
				throw 'missing OC.Share.ShareConfigModel';
			}
		},

		render: function() {
			if (!this.model.hasReshare()
				|| this.model.getReshareOwner() === OC.currentUser)
			{
				this.$el.empty();
				return this;
			}

			var reshareTemplate = this.template();
			var ownerDisplayName = this.model.getReshareOwnerDisplayname();
			var sharedByText = '';
			if (this.model.getReshareType() === OC.Share.SHARE_TYPE_GROUP) {
				sharedByText = t(
					'core',
					'Shared with you and the group {group} by {owner}',
					{
						group: this.model.getReshareWithDisplayName(),
						owner: ownerDisplayName
					},
					undefined,
					{escape: false}
				);
			}  else {
				sharedByText = t(
					'core',
					'Shared with you by {owner}',
					{ owner: ownerDisplayName },
					undefined,
					{escape: false}
				);
			}

			this.$el.html(reshareTemplate({
				reshareOwner: this.model.getReshareOwner(),
				sharedByText: sharedByText
			}));

			this.$el.find('.avatar').each(function() {
				var $this = $(this);
				$this.avatar($this.data('username'), 32);
			});

			this.$el.find('.reshare').contactsMenu(
				this.model.getReshareOwner(),
				OC.Share.SHARE_TYPE_USER,
				this.$el);

			return this;
		},

		/**
		 * @returns {Function} from Handlebars
		 * @private
		 */
		template: function () {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template;
		}

	});

	OC.Share.ShareDialogResharerInfoView = ShareDialogResharerInfoView;

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

/* globals Clipboard, Handlebars */

(function() {
	if (!OC.Share) {
		OC.Share = {};
	}

	var PASSWORD_PLACEHOLDER = '**********';
	var PASSWORD_PLACEHOLDER_MESSAGE = t('core', 'Choose a password for the public link');
	var PASSWORD_PLACEHOLDER_MESSAGE_OPTIONAL = t('core', 'Choose a password for the public link or press the "Enter" key');

	var TEMPLATE =
			'{{#if shareAllowed}}' +
			'<span class="icon-loading-small hidden"></span>' +
			'<input type="checkbox" name="linkCheckbox" id="linkCheckbox-{{cid}}" class="checkbox linkCheckbox" value="1" {{#if isLinkShare}}checked="checked"{{/if}} />' +
			'<label for="linkCheckbox-{{cid}}">{{linkShareLabel}}</label>' +
			'<br />' +
			'<div class="oneline">' +
			'<label for="linkText-{{cid}}" class="hidden-visually">{{urlLabel}}</label>' +
			'<input id="linkText-{{cid}}" class="linkText {{#unless isLinkShare}}hidden{{/unless}}" type="text" readonly="readonly" value="{{shareLinkURL}}" />' +
			'{{#if singleAction}}' +
				'<a class="{{#unless isLinkShare}}hidden-visually{{/unless}} clipboardButton icon icon-clippy" data-clipboard-target="#linkText-{{cid}}"></a>' +
			'{{else}}' +
				'<a class="{{#unless isLinkShare}}hidden-visually{{/unless}}" href="#"><span class="linkMore icon icon-more"></span></a>' +
				'{{{popoverMenu}}}' +
			'{{/if}}' +
			'</div>' +
			'{{#if publicUpload}}' +
				'<div>' +
					'<span class="icon-loading-small hidden"></span>' +
					'<input type="radio" name="publicUpload" value="{{publicUploadRValue}}" id="sharingDialogAllowPublicUpload-r-{{cid}}" class="radio publicUploadRadio" {{{publicUploadRChecked}}} />' +
					'<label for="sharingDialogAllowPublicUpload-r-{{cid}}">{{publicUploadRLabel}}</label>' +
				'</div>' +
				'<div>' +
					'<span class="icon-loading-small hidden"></span>' +
					'<input type="radio" name="publicUpload" value="{{publicUploadRWValue}}" id="sharingDialogAllowPublicUpload-rw-{{cid}}" class="radio publicUploadRadio" {{{publicUploadRWChecked}}} />' +
					'<label for="sharingDialogAllowPublicUpload-rw-{{cid}}">{{publicUploadRWLabel}}</label>' +
				'</div>' +
				'<div>' +
					'<span class="icon-loading-small hidden"></span>' +
					'<input type="radio" name="publicUpload" value="{{publicUploadWValue}}" id="sharingDialogAllowPublicUpload-w-{{cid}}" class="radio publicUploadRadio" {{{publicUploadWChecked}}} />' +
					'<label for="sharingDialogAllowPublicUpload-w-{{cid}}">{{publicUploadWLabel}}</label>' +
				'</div>' +
			'{{/if}}' +
			'     {{#if publicEditing}}' +
			'<div id="allowPublicEditingWrapper">' +
			'    <span class="icon-loading-small hidden"></span>' +
			'    <input type="checkbox" value="1" name="allowPublicEditing" id="sharingDialogAllowPublicEditing-{{cid}}" class="checkbox publicEditingCheckbox" {{{publicEditingChecked}}} />' +
			'<label for="sharingDialogAllowPublicEditing-{{cid}}">{{publicEditingLabel}}</label>' +
			'</div>' +
			'    {{/if}}' +
			'    {{#if showPasswordCheckBox}}' +
			'<input type="checkbox" name="showPassword" id="showPassword-{{cid}}" class="checkbox showPasswordCheckbox" {{#if isPasswordSet}}checked="checked"{{/if}} value="1" />' +
			'<label for="showPassword-{{cid}}">{{enablePasswordLabel}}</label>' +
			'    {{/if}}' +
			'<div id="linkPass" class="oneline linkPass {{#unless isPasswordSet}}hidden{{/unless}}">' +
			'    <label for="linkPassText-{{cid}}" class="hidden-visually">{{passwordLabel}}</label>' +
			'    {{#if showPasswordCheckBox}}' +
			'    <input id="linkPassText-{{cid}}" class="linkPassText" type="password" placeholder="{{passwordPlaceholder}}" autocomplete="new-password" />' +
			'    {{else}}' +
			'    <input id="linkPassText-{{cid}}" class="linkPassText" type="password" placeholder="{{passwordPlaceholderInitial}}" autocomplete="new-password" />' +
			'    {{/if}}' +
			'    <span class="icon icon-loading-small hidden"></span>' +
			'</div>' +
			'{{else}}' +
			// FIXME: this doesn't belong in this view
			'{{#if noSharingPlaceholder}}<input id="shareWith-{{cid}}" class="shareWithField" type="text" placeholder="{{noSharingPlaceholder}}" disabled="disabled"/>{{/if}}' +
			'{{/if}}'
		;
	var TEMPLATE_POPOVER_MENU =
		'<div class="popovermenu bubble hidden menu socialSharingMenu">' +
			'<ul>' +
				'<li>' +
					'<a href="#" class="shareOption menuitem clipboardButton" data-clipboard-target="#linkText-{{cid}}">' +
						'<span class="icon icon-clippy" ></span>' +
						'<span>{{copyLabel}}</span>' +
					'</a>' +
				'</li>' +
				'{{#each social}}' +
					'<li>' +
						'<a href="#" class="shareOption menuitem pop-up" data-url="{{url}}" data-window="{{newWindow}}">' +
							'<span class="icon {{iconClass}}"' +
								'></span><span>{{label}}' +
							'</span>' +
						'</a>' +
					'</li>' +
				'{{/each}}' +
			'</ul>' +
		'</div>';

	/**
	 * @class OCA.Share.ShareDialogLinkShareView
	 * @member {OC.Share.ShareItemModel} model
	 * @member {jQuery} $el
	 * @memberof OCA.Sharing
	 * @classdesc
	 *
	 * Represents the GUI of the share dialogue
	 *
	 */
	var ShareDialogLinkShareView = OC.Backbone.View.extend({
		/** @type {string} **/
		id: 'shareDialogLinkShare',

		/** @type {OC.Share.ShareConfigModel} **/
		configModel: undefined,

		/** @type {Function} **/
		_template: undefined,

		/** @type {Function} **/
		_popoverMenuTemplate: undefined,

		/** @type {boolean} **/
		showLink: true,

		events: {
			'focusout input.linkPassText': 'onPasswordEntered',
			'keyup input.linkPassText': 'onPasswordKeyUp',
			'click .linkCheckbox': 'onLinkCheckBoxChange',
			'click .linkText': 'onLinkTextClick',
			'change .publicEditingCheckbox': 'onAllowPublicEditingChange',
			'click .showPasswordCheckbox': 'onShowPasswordClick',
			'click .icon-more': 'onToggleMenu',
			'click .pop-up': 'onPopUpClick',
			'change .publicUploadRadio': 'onPublicUploadChange'
		},

		initialize: function(options) {
			var view = this;

			this.model.on('change:permissions', function() {
				view.render();
			});

			this.model.on('change:itemType', function() {
				view.render();
			});

			this.model.on('change:allowPublicUploadStatus', function() {
				view.render();
			});

			this.model.on('change:hideFileListStatus', function() {
				view.render();
			});

			this.model.on('change:linkShare', function() {
				view.render();
			});

			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			} else {
				throw 'missing OC.Share.ShareConfigModel';
			}

			_.bindAll(
				this,
				'onLinkCheckBoxChange',
				'onPasswordEntered',
				'onPasswordKeyUp',
				'onLinkTextClick',
				'onShowPasswordClick',
				'onAllowPublicEditingChange',
				'onPublicUploadChange'
			);

			var clipboard = new Clipboard('.clipboardButton');
			clipboard.on('success', function(e) {
				var $input = $(e.trigger);
				$input.tooltip('hide')
					.attr('data-original-title', t('core', 'Copied!'))
					.tooltip('fixTitle')
					.tooltip({placement: 'bottom', trigger: 'manual'})
					.tooltip('show');
				_.delay(function() {
					$input.tooltip('hide');
					if (OC.Share.Social.Collection.size() == 0) {
						$input.attr('data-original-title', t('core', 'Copy'))
							.tooltip('fixTitle');
					} else {
						$input.tooltip("destroy");
					}
				}, 3000);
			});
			clipboard.on('error', function (e) {
				var $input = $(e.trigger);
				var actionMsg = '';
				if (/iPhone|iPad/i.test(navigator.userAgent)) {
					actionMsg = t('core', 'Not supported!');
				} else if (/Mac/i.test(navigator.userAgent)) {
					actionMsg = t('core', 'Press ⌘-C to copy.');
				} else {
					actionMsg = t('core', 'Press Ctrl-C to copy.');
				}

				$input.tooltip('hide')
					.attr('data-original-title', actionMsg)
					.tooltip('fixTitle')
					.tooltip({placement: 'bottom', trigger: 'manual'})
					.tooltip('show');
				_.delay(function () {
					$input.tooltip('hide');
					if (OC.Share.Social.Collection.size() == 0) {
						$input.attr('data-original-title', t('core', 'Copy'))
							.tooltip('fixTitle');
					} else {
						$input.tooltip("destroy");
					}
				}, 3000);
			});

		},

		onLinkCheckBoxChange: function() {
			var $checkBox = this.$el.find('.linkCheckbox');
			var $loading = $checkBox.siblings('.icon-loading-small');
			if(!$loading.hasClass('hidden')) {
				return false;
			}

			if($checkBox.is(':checked')) {
				if(this.configModel.get('enforcePasswordForPublicLink') === false && this.configModel.get('enableLinkPasswordByDefault') === false) {
					$loading.removeClass('hidden');
					// this will create it
					this.model.saveLinkShare();
				} else {
					this.$el.find('.linkPass').slideToggle(OC.menuSpeed);
					this.$el.find('.linkPassText').focus();
				}
			} else {
				if (this.model.get('linkShare').isLinkShare) {
					$loading.removeClass('hidden');
					this.model.removeLinkShare();
				} else {
					this.$el.find('.linkPass').slideToggle(OC.menuSpeed);
				}
			}
		},

		onLinkTextClick: function() {
			var $el = this.$el.find('.linkText');
			$el.focus();
			$el.select();
		},

		onShowPasswordClick: function() {
			this.$el.find('.linkPass').slideToggle(OC.menuSpeed);
			if(!this.$el.find('.showPasswordCheckbox').is(':checked')) {
				this.model.saveLinkShare({
					password: ''
				});
			} else {
				if (!OC.Util.isIE()) {
					this.$el.find('.linkPassText').focus();
				}
			}
		},

		onPasswordKeyUp: function(event) {
			if(event.keyCode === 13) {
				this.onPasswordEntered();
			}
		},

		onPasswordEntered: function() {
			var $loading = this.$el.find('.linkPass .icon-loading-small');
			if (!$loading.hasClass('hidden')) {
				// still in process
				return;
			}
			var $input = this.$el.find('.linkPassText');
			$input.removeClass('error');
			var password = $input.val();

			if (this.$el.find('.linkPassText').attr('placeholder') === PASSWORD_PLACEHOLDER_MESSAGE_OPTIONAL) {

				// in IE9 the password might be the placeholder due to bugs in the placeholders polyfill
				if(password === PASSWORD_PLACEHOLDER_MESSAGE_OPTIONAL) {
					password = '';
				}
			} else {

				// in IE9 the password might be the placeholder due to bugs in the placeholders polyfill
				if(password === '' || password === PASSWORD_PLACEHOLDER || password === PASSWORD_PLACEHOLDER_MESSAGE) {
					return;
				}
			}

			$loading
				.removeClass('hidden')
				.addClass('inlineblock');

			this.model.saveLinkShare({
				password: password
			}, {
				complete: function(model) {
					$loading.removeClass('inlineblock').addClass('hidden');
				},
				error: function(model, msg) {
					// destroy old tooltips
					$input.tooltip('destroy');
					$input.addClass('error');
					$input.attr('title', msg);
					$input.tooltip({placement: 'bottom', trigger: 'manual'});
					$input.tooltip('show');
				}
			});
		},

		onAllowPublicEditingChange: function() {
			var $checkbox = this.$('.publicEditingCheckbox');
			$checkbox.siblings('.icon-loading-small').removeClass('hidden').addClass('inlineblock');

			var permissions = OC.PERMISSION_READ;
			if($checkbox.is(':checked')) {
				permissions = OC.PERMISSION_UPDATE | OC.PERMISSION_READ;
			}

			this.model.saveLinkShare({
				permissions: permissions
			});
		},


	onPublicUploadChange: function(e) {
			var permissions = e.currentTarget.value;
			this.model.saveLinkShare({
				permissions: permissions
			});
		},

		render: function() {
			var linkShareTemplate = this.template();
			var resharingAllowed = this.model.sharePermissionPossible();

			if(!resharingAllowed
				|| !this.showLink
				|| !this.configModel.isShareWithLinkAllowed())
			{
				var templateData = {shareAllowed: false};
				if (!resharingAllowed) {
					// add message
					templateData.noSharingPlaceholder = t('core', 'Resharing is not allowed');
				}
				this.$el.html(linkShareTemplate(templateData));
				return this;
			}

			var publicUpload =
				this.model.isFolder()
				&& this.model.createPermissionPossible()
				&& this.configModel.isPublicUploadEnabled();

			var publicUploadRWChecked = '';
			var publicUploadRChecked = '';
			var publicUploadWChecked = '';

			switch (this.model.linkSharePermissions()) {
				case OC.PERMISSION_READ:
					publicUploadRChecked = 'checked';
					break;
				case OC.PERMISSION_CREATE:
					publicUploadWChecked = 'checked';
					break;
				case OC.PERMISSION_UPDATE | OC.PERMISSION_CREATE | OC.PERMISSION_READ | OC.PERMISSION_DELETE:
					publicUploadRWChecked = 'checked';
					break;
			}

			var publicEditingChecked = '';
			if(this.model.isPublicEditingAllowed()) {
				publicEditingChecked = 'checked="checked"';
			}

			var isLinkShare = this.model.get('linkShare').isLinkShare;
			var isPasswordSet = !!this.model.get('linkShare').password;
			var showPasswordCheckBox = isLinkShare
				&& (   !this.configModel.get('enforcePasswordForPublicLink')
					|| !this.model.get('linkShare').password);
			var passwordPlaceholderInitial = this.configModel.get('enforcePasswordForPublicLink')
				? PASSWORD_PLACEHOLDER_MESSAGE : PASSWORD_PLACEHOLDER_MESSAGE_OPTIONAL;

			var publicEditable =
				!this.model.isFolder()
				&& isLinkShare
				&& this.model.updatePermissionPossible();

			var link = this.model.get('linkShare').link;
			var social = [];
			OC.Share.Social.Collection.each(function(model) {
				var url = model.get('url');
				url = url.replace('{{reference}}', link);

				social.push({
					url: url,
					label: t('core', 'Share to {name}', {name: model.get('name')}),
					name: model.get('name'),
					iconClass: model.get('iconClass'),
					newWindow: model.get('newWindow')
				});
			});

			var popover = this.popoverMenuTemplate({
				cid: this.cid,
				copyLabel: t('core', 'Copy'),
				social: social
			});

			this.$el.html(linkShareTemplate({
				cid: this.cid,
				shareAllowed: true,
				isLinkShare: isLinkShare,
				shareLinkURL: this.model.get('linkShare').link,
				linkShareLabel: t('core', 'Share link'),
				urlLabel: t('core', 'Link'),
				enablePasswordLabel: t('core', 'Password protect'),
				passwordLabel: t('core', 'Password'),
				passwordPlaceholder: isPasswordSet ? PASSWORD_PLACEHOLDER : PASSWORD_PLACEHOLDER_MESSAGE,
				passwordPlaceholderInitial: passwordPlaceholderInitial,
				isPasswordSet: isPasswordSet,
				showPasswordCheckBox: showPasswordCheckBox,
				publicUpload: publicUpload && isLinkShare,
				publicEditing: publicEditable,
				publicEditingChecked: publicEditingChecked,
				publicEditingLabel: t('core', 'Allow editing'),
				mailPrivatePlaceholder: t('core', 'Email link to person'),
				mailButtonText: t('core', 'Send'),
				singleAction: OC.Share.Social.Collection.size() == 0,
				popoverMenu: popover,
				publicUploadRWLabel: t('core', 'Allow upload and editing'),
				publicUploadRLabel: t('core', 'Read only'),
				publicUploadWLabel: t('core', 'File drop (upload only)'),
				publicUploadRWValue: OC.PERMISSION_UPDATE | OC.PERMISSION_CREATE | OC.PERMISSION_READ | OC.PERMISSION_DELETE,
				publicUploadRValue: OC.PERMISSION_READ,
				publicUploadWValue: OC.PERMISSION_CREATE,
				publicUploadRWChecked: publicUploadRWChecked,
				publicUploadRChecked: publicUploadRChecked,
				publicUploadWChecked: publicUploadWChecked
			}));

			if (OC.Share.Social.Collection.size() == 0) {
				this.$el.find('.clipboardButton').tooltip({
					placement: 'bottom',
					title: t('core', 'Copy'),
					trigger: 'hover'
				});
			}

			this.delegateEvents();

			return this;
		},

		onToggleMenu: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var $element = $(event.target);
			var $li = $element.closest('.oneline');
			var $menu = $li.find('.popovermenu');

			OC.showMenu(null, $menu);
			this._menuOpen = $li.data('share-id');
		},

		/**
		 * @returns {Function} from Handlebars
		 * @private
		 */
		template: function () {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template;
		},

		/**
		 * renders the popover template and returns the resulting HTML
		 *
		 * @param {Object} data
		 * @returns {string}
		 */
		popoverMenuTemplate: function(data) {
			if(!this._popoverMenuTemplate) {
				this._popoverMenuTemplate = Handlebars.compile(TEMPLATE_POPOVER_MENU);
			}
			return this._popoverMenuTemplate(data);
		},

		onPopUpClick: function(event) {
			event.preventDefault();
			event.stopPropagation();

			var url = $(event.currentTarget).data('url');
			var newWindow = $(event.currentTarget).data('window');
			$(event.currentTarget).tooltip('hide');
			if (url) {
				if (newWindow === true) {
					var width = 600;
					var height = 400;
					var left = (screen.width / 2) - (width / 2);
					var top = (screen.height / 2) - (height / 2);

					window.open(url, 'name', 'width=' + width + ', height=' + height + ', top=' + top + ', left=' + left);
				} else {
					window.location.href = url;
				}
			}
		}

	});

	OC.Share.ShareDialogLinkShareView = ShareDialogLinkShareView;

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

/* global moment, Handlebars */

(function() {
	if (!OC.Share) {
		OC.Share = {};
	}

	var TEMPLATE =
			// currently expiration is only effective for link share.
			// this is about to change in future. Therefore this is not included
			// in the LinkShareView to ease reusing it in future. Then,
			// modifications (getting rid of IDs) are still necessary.
			'{{#if isLinkShare}}' +
			'<input type="checkbox" name="expirationCheckbox" class="expirationCheckbox checkbox" id="expirationCheckbox-{{cid}}" value="1" ' +
				'{{#if isExpirationSet}}checked="checked"{{/if}} {{#if disableCheckbox}}disabled="disabled"{{/if}} />' +
			'<label for="expirationCheckbox-{{cid}}">{{setExpirationLabel}}</label>' +
			'<div class="expirationDateContainer {{#unless isExpirationSet}}hidden{{/unless}}">' +
			'    <label for="expirationDate" class="hidden-visually" value="{{expirationDate}}">{{expirationLabel}}</label>' +
			'    <input id="expirationDate" class="datepicker" type="text" placeholder="{{expirationDatePlaceholder}}" value="{{expirationValue}}" />' +
			'</div>' +
			'    {{#if isExpirationEnforced}}' +
				// originally the expire message was shown when a default date was set, however it never had text
			'<em id="defaultExpireMessage">{{defaultExpireMessage}}</em>' +
			'    {{/if}}' +
			'{{/if}}'
		;

	/**
	 * @class OCA.Share.ShareDialogExpirationView
	 * @member {OC.Share.ShareItemModel} model
	 * @member {jQuery} $el
	 * @memberof OCA.Sharing
	 * @classdesc
	 *
	 * Represents the expiration part in the GUI of the share dialogue
	 *
	 */
	var ShareDialogExpirationView = OC.Backbone.View.extend({
		/** @type {string} **/
		id: 'shareDialogLinkShare',

		/** @type {OC.Share.ShareConfigModel} **/
		configModel: undefined,

		/** @type {Function} **/
		_template: undefined,

		/** @type {boolean} **/
		showLink: true,

		className: 'hidden',

		events: {
			'change .expirationCheckbox': '_onToggleExpiration',
			'change .datepicker': '_onChangeExpirationDate'
		},

		initialize: function(options) {
			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			} else {
				throw 'missing OC.Share.ShareConfigModel';
			}

			var view = this;
			this.configModel.on('change:isDefaultExpireDateEnforced', function() {
				view.render();
			});

			this.model.on('change:itemType', function() {
				view.render();
			});

			this.model.on('change:linkShare', function() {
				view.render();
			});
		},

		_onToggleExpiration: function(event) {
			var $checkbox = $(event.target);
			var state = $checkbox.prop('checked');
			// TODO: slide animation
			this.$el.find('.expirationDateContainer').toggleClass('hidden', !state);
			if (!state) {
				// discard expiration date
				this.model.get('linkShare').expiration = '';
				this.model.saveLinkShare({
					expireDate: ''
				});
			} else {
				this.$el.find('#expirationDate').focus();
			}
		},

		_onChangeExpirationDate: function(event) {
			var $target = $(event.target);
			$target.tooltip('hide');
			$target.removeClass('error');

			var expiration = moment($target.val(), 'DD-MM-YYYY').format('YYYY-MM-DD');
			this.model.get('linkShare').expiration = expiration;
			this.model.saveLinkShare({
				expiration: expiration
			}, {
				error: function(model, message) {
					if (!message) {
						$target.attr('title', t('core', 'Error setting expiration date'));
					} else {
						$target.attr('title', message);
					}
					$target.tooltip({gravity: 'n'});
					$target.tooltip('show');
					$target.addClass('error');
				}
			});
		},

		render: function() {
			var defaultExpireMessage = '';
			var defaultExpireDays = this.configModel.get('defaultExpireDate');
			var isExpirationEnforced = this.configModel.get('isDefaultExpireDateEnforced');

			if(    (this.model.isFolder() || this.model.isFile())
				&& isExpirationEnforced) {
				defaultExpireMessage = t(
					'core',
					'The public link will expire no later than {days} days after it is created',
					{'days': defaultExpireDays }
				);
			}

			var isExpirationSet = !!this.model.get('linkShare').expiration || isExpirationEnforced;

			var expiration;
			if (isExpirationSet) {
				expiration = moment(this.model.get('linkShare').expiration, 'YYYY-MM-DD').format('DD-MM-YYYY');
			}

			this.$el.html(this.template({
				cid: this.cid,
				setExpirationLabel: t('core', 'Set expiration date'),
				expirationLabel: t('core', 'Expiration'),
				expirationDatePlaceholder: t('core', 'Expiration date'),
				defaultExpireMessage: defaultExpireMessage,
				isLinkShare: this.model.get('linkShare').isLinkShare,
				isExpirationSet: isExpirationSet,
				isExpirationEnforced: isExpirationEnforced,
				disableCheckbox: isExpirationEnforced && isExpirationSet,
				expirationValue: expiration
			}));

			// what if there is another date picker on that page?
			var minDate = new Date();
			var maxDate = null;
			// min date should always be the next day
			minDate.setDate(minDate.getDate()+1);

			if(isExpirationSet) {
				if(isExpirationEnforced) {
					// TODO: hack: backend returns string instead of integer
					var shareTime = this.model.get('linkShare').stime;
					if (_.isNumber(shareTime)) {
						shareTime = new Date(shareTime * 1000);
					}
					if (!shareTime) {
						shareTime = new Date(); // now
					}
					shareTime = OC.Util.stripTime(shareTime).getTime();
					maxDate = new Date(shareTime + defaultExpireDays * 24 * 3600 * 1000);
				}
			}
			$.datepicker.setDefaults({
				minDate: minDate,
				maxDate: maxDate
			});

			this.$el.find('.datepicker').datepicker({dateFormat : 'dd-mm-yy'});

			this.delegateEvents();

			return this;
		},

		/**
		 * @returns {Function} from Handlebars
		 * @private
		 */
		template: function (data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			return this._template(data);
		}

	});

	OC.Share.ShareDialogExpirationView = ShareDialogExpirationView;

})();


/* global OC, Handlebars */

/*
 * Copyright (c) 2015
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/* globals Handlebars */

(function() {

	var PASSWORD_PLACEHOLDER = '**********';
	var PASSWORD_PLACEHOLDER_MESSAGE = t('core', 'Choose a password for the mail share');

	if (!OC.Share) {
		OC.Share = {};
	}

	var TEMPLATE =
			'<ul id="shareWithList" class="shareWithList">' +
			'{{#each sharees}}' +
				'<li data-share-id="{{shareId}}" data-share-type="{{shareType}}" data-share-with="{{shareWith}}">' +
					'<div class="avatar {{#if modSeed}}imageplaceholderseed{{/if}}" data-username="{{shareWith}}" data-displayname="{{shareWithDisplayName}}" {{#if modSeed}}data-seed="{{shareWith}} {{shareType}}"{{/if}}></div>' +
					'<span class="username" title="{{shareWithTitle}}">{{shareWithDisplayName}}</span>' +
					'<span class="sharingOptionsGroup">' +
						'{{#if editPermissionPossible}}' +
						'<span class="shareOption">' +
							'<input id="canEdit-{{cid}}-{{shareWith}}" type="checkbox" name="edit" class="permissions checkbox" {{#if hasEditPermission}}checked="checked"{{/if}} />' +
							'<label for="canEdit-{{cid}}-{{shareWith}}">{{canEditLabel}}</label>' +
						'</span>' +
						'{{/if}}' +
						'<a href="#"><span class="icon icon-more"></span></a>' +
						'{{{popoverMenu}}}' +
					'</span>' +
				'</li>' +
			'{{/each}}' +
			'{{#each linkReshares}}' +
				'<li data-share-id="{{shareId}}" data-share-type="{{shareType}}">' +
					'<div class="avatar" data-username="{{shareInitiator}}"></div>' +
					'<span class="has-tooltip username" title="{{shareInitiator}}">' + t('core', '{{shareInitiatorDisplayName}} shared via link') + '</span>' +

					'<span class="sharingOptionsGroup">' +
						'<a href="#" class="unshare"><span class="icon-loading-small hidden"></span><span class="icon icon-delete"></span><span class="hidden-visually">{{unshareLabel}}</span></a>' +
					'</span>' +
				'</li>' +
			'{{/each}}' +
			'</ul>'
		;

	var TEMPLATE_POPOVER_MENU =
		'<div class="popovermenu bubble hidden menu">' +
			'<ul>' +
				'{{#if isResharingAllowed}} {{#if sharePermissionPossible}} {{#unless isMailShare}}' +
				'<li>' +
					'<span class="shareOption menuitem">' +
						'<input id="canShare-{{cid}}-{{shareWith}}" type="checkbox" name="share" class="permissions checkbox" {{#if hasSharePermission}}checked="checked"{{/if}} data-permissions="{{sharePermission}}" />' +
						'<label for="canShare-{{cid}}-{{shareWith}}">{{canShareLabel}}</label>' +
					'</span>' +
				'</li>' +
				'{{/unless}} {{/if}} {{/if}}' +
				'{{#if isFolder}}' +
					'{{#if createPermissionPossible}}{{#unless isMailShare}}' +
					'<li>' +
						'<span class="shareOption menuitem">' +
							'<input id="canCreate-{{cid}}-{{shareWith}}" type="checkbox" name="create" class="permissions checkbox" {{#if hasCreatePermission}}checked="checked"{{/if}} data-permissions="{{createPermission}}"/>' +
							'<label for="canCreate-{{cid}}-{{shareWith}}">{{createPermissionLabel}}</label>' +
						'</span>' +
					'</li>' +
					'{{/unless}}{{/if}}' +
					'{{#if updatePermissionPossible}}{{#unless isMailShare}}' +
					'<li>' +
						'<span class="shareOption menuitem">' +
							'<input id="canUpdate-{{cid}}-{{shareWith}}" type="checkbox" name="update" class="permissions checkbox" {{#if hasUpdatePermission}}checked="checked"{{/if}} data-permissions="{{updatePermission}}"/>' +
							'<label for="canUpdate-{{cid}}-{{shareWith}}">{{updatePermissionLabel}}</label>' +
						'</span>' +
					'</li>' +
					'{{/unless}}{{/if}}' +
					'{{#if deletePermissionPossible}}{{#unless isMailShare}}' +
					'<li>' +
						'<span class="shareOption menuitem">' +
							'<input id="canDelete-{{cid}}-{{shareWith}}" type="checkbox" name="delete" class="permissions checkbox" {{#if hasDeletePermission}}checked="checked"{{/if}} data-permissions="{{deletePermission}}"/>' +
							'<label for="canDelete-{{cid}}-{{shareWith}}">{{deletePermissionLabel}}</label>' +
						'</span>' +
					'</li>' +
					'{{/unless}}{{/if}}' +
				'{{/if}}' +
				'{{#if isMailShare}}' +
					'{{#if hasCreatePermission}}' +
						'<li>' +
							'<span class="shareOption menuitem">' +
								'<input id="secureDrop-{{cid}}-{{shareId}}" type="checkbox" name="secureDrop" class="checkbox secureDrop" {{#if secureDropMode}}checked="checked"{{/if}} data-permissions="{{readPermission}}"/>' +
								'<label for="secureDrop-{{cid}}-{{shareId}}">{{secureDropLabel}}</label>' +
							'</span>' +
						'</li>' +
					'{{/if}}' +
					'<li>' +
						'<span class="shareOption menuitem">' +
							'<input id="password-{{cid}}-{{shareId}}" type="checkbox" name="password" class="password checkbox" {{#if isPasswordSet}}checked="checked"{{/if}}{{#if isPasswordSet}}{{#if isPasswordForMailSharesRequired}}disabled=""{{/if}}{{/if}}" />' +
							'<label for="password-{{cid}}-{{shareId}}">{{passwordLabel}}</label>' +
							'<div class="passwordContainer-{{cid}}-{{shareId}} {{#unless isPasswordSet}}hidden{{/unless}}">' +
							'    <label for="passwordField-{{cid}}-{{shareId}}" class="hidden-visually" value="{{password}}">{{passwordLabel}}</label>' +
							'    <input id="passwordField-{{cid}}-{{shareId}}" class="passwordField" type="password" placeholder="{{passwordPlaceholder}}" value="{{passwordValue}}" />' +
							'    <span class="icon-loading-small hidden"></span>' +
							'</div>' +
						'</span>' +
					'</li>' +
				'{{/if}}' +
				'<li>' +
					'<span class="shareOption menuitem">' +
						'<input id="expireDate-{{cid}}-{{shareId}}" type="checkbox" name="expirationDate" class="expireDate checkbox" {{#if hasExpireDate}}checked="checked"{{/if}}" />' +
						'<label for="expireDate-{{cid}}-{{shareId}}">{{expireDateLabel}}</label>' +
						'<div class="expirationDateContainer-{{cid}}-{{shareId}} {{#unless hasExpireDate}}hidden{{/unless}}">' +
						'    <label for="expirationDatePicker-{{cid}}-{{shareId}}" class="hidden-visually" value="{{expirationDate}}">{{expirationLabel}}</label>' +
						'    <input id="expirationDatePicker-{{cid}}-{{shareId}}" class="datepicker" type="text" placeholder="{{expirationDatePlaceholder}}" value="{{#if hasExpireDate}}{{expireDate}}{{else}}{{defaultExpireDate}}{{/if}}" />' +
						'</div>' +
					'</span>' +
				'</li>' +
				'<li>' +
					'<a href="#" class="unshare"><span class="icon-loading-small hidden"></span><span class="icon icon-delete"></span><span>{{unshareLabel}}</span></a>' +
				'</li>' +
			'</ul>' +
		'</div>';

	/**
	 * @class OCA.Share.ShareDialogShareeListView
	 * @member {OC.Share.ShareItemModel} model
	 * @member {jQuery} $el
	 * @memberof OCA.Sharing
	 * @classdesc
	 *
	 * Represents the sharee list part in the GUI of the share dialogue
	 *
	 */
	var ShareDialogShareeListView = OC.Backbone.View.extend({
		/** @type {string} **/
		id: 'shareDialogLinkShare',

		/** @type {OC.Share.ShareConfigModel} **/
		configModel: undefined,

		/** @type {Function} **/
		_template: undefined,

		/** @type {Function} **/
		_popoverMenuTemplate: undefined,

		_menuOpen: false,

		/** @type {boolean|number} **/
		_renderPermissionChange: false,

		events: {
			'click .unshare': 'onUnshare',
			'click .icon-more': 'onToggleMenu',
			'click .permissions': 'onPermissionChange',
			'click .expireDate' : 'onExpireDateChange',
			'click .password' : 'onMailSharePasswordProtectChange',
			'click .secureDrop' : 'onSecureDropChange',
			'keyup input.passwordField': 'onMailSharePasswordKeyUp',
			'focusout input.passwordField': 'onMailSharePasswordEntered',
			'change .datepicker': 'onChangeExpirationDate',
			'click .datepicker' : 'showDatePicker'
		},

		initialize: function(options) {
			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			} else {
				throw 'missing OC.Share.ShareConfigModel';
			}

			var view = this;
			this.model.on('change:shares', function() {
				view.render();
			});
		},

		/**
		 *
		 * @param {OC.Share.Types.ShareInfo} shareInfo
		 * @returns {object}
		 */
		getShareeObject: function(shareIndex) {
			var shareWith = this.model.getShareWith(shareIndex);
			var shareWithDisplayName = this.model.getShareWithDisplayName(shareIndex);
			var shareWithTitle = '';
			var shareType = this.model.getShareType(shareIndex);
			var sharedBy = this.model.getSharedBy(shareIndex);
			var sharedByDisplayName = this.model.getSharedByDisplayName(shareIndex);

			var hasPermissionOverride = {};
			if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				shareWithDisplayName = shareWithDisplayName + " (" + t('core', 'group') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_REMOTE) {
				shareWithDisplayName = shareWithDisplayName + " (" + t('core', 'remote') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_EMAIL) {
				shareWithDisplayName = shareWithDisplayName + " (" + t('core', 'email') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_CIRCLE) {
			}

			if (shareType === OC.Share.SHARE_TYPE_GROUP) {
				shareWithTitle = shareWith + " (" + t('core', 'group') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_REMOTE) {
				shareWithTitle = shareWith + " (" + t('core', 'remote') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_EMAIL) {
				shareWithTitle = shareWith + " (" + t('core', 'email') + ')';
			} else if (shareType === OC.Share.SHARE_TYPE_CIRCLE) {
				shareWithTitle = shareWith;
			}

			if (sharedBy !== oc_current_user) {
				var empty = shareWithTitle === '';
				if (!empty) {
					shareWithTitle += ' (';
				}
				shareWithTitle += t('core', 'shared by {sharer}', {sharer: sharedByDisplayName});
				if (!empty) {
					shareWithTitle += ')';
				}
			}

			var share = this.model.get('shares')[shareIndex];
			var password = share.password;
			var hasPassword = password !== null && password !== '';


			return _.extend(hasPermissionOverride, {
				cid: this.cid,
				hasSharePermission: this.model.hasSharePermission(shareIndex),
				hasEditPermission: this.model.hasEditPermission(shareIndex),
				hasCreatePermission: this.model.hasCreatePermission(shareIndex),
				hasUpdatePermission: this.model.hasUpdatePermission(shareIndex),
				hasDeletePermission: this.model.hasDeletePermission(shareIndex),
				shareWith: shareWith,
				shareWithDisplayName: shareWithDisplayName,
				shareWithTitle: shareWithTitle,
				shareType: shareType,
				shareId: this.model.get('shares')[shareIndex].id,
				modSeed: shareType !== OC.Share.SHARE_TYPE_USER,
				isRemoteShare: shareType === OC.Share.SHARE_TYPE_REMOTE,
				isMailShare: shareType === OC.Share.SHARE_TYPE_EMAIL,
				isCircleShare: shareType === OC.Share.SHARE_TYPE_CIRCLE,
				isFileSharedByMail: shareType === OC.Share.SHARE_TYPE_EMAIL && !this.model.isFolder(),
				isPasswordSet: hasPassword,
				secureDropMode: !this.model.hasReadPermission(shareIndex),
				hasExpireDate: this.model.getExpireDate(shareIndex) !== null,
				expireDate: moment(this.model.getExpireDate(shareIndex), 'YYYY-MM-DD').format('DD-MM-YYYY'),
				passwordPlaceholder: hasPassword ? PASSWORD_PLACEHOLDER : PASSWORD_PLACEHOLDER_MESSAGE,
			});
		},

		getShareProperties: function() {
			return {
				unshareLabel: t('core', 'Unshare'),
				canShareLabel: t('core', 'Can reshare'),
				canEditLabel: t('core', 'Can edit'),
				createPermissionLabel: t('core', 'Can create'),
				updatePermissionLabel: t('core', 'Can change'),
				deletePermissionLabel: t('core', 'Can delete'),
				secureDropLabel: t('core', 'File drop (upload only)'),
				expireDateLabel: t('core', 'Set expiration date'),
				passwordLabel: t('core', 'Password protect'),
				crudsLabel: t('core', 'Access control'),
				expirationDatePlaceholder: t('core', 'Expiration date'),
				defaultExpireDate: moment().add(1, 'day').format('DD-MM-YYYY'), // Can't expire today
				triangleSImage: OC.imagePath('core', 'actions/triangle-s'),
				isResharingAllowed: this.configModel.get('isResharingAllowed'),
				isPasswordForMailSharesRequired: this.configModel.get('isPasswordForMailSharesRequired'),
				sharePermissionPossible: this.model.sharePermissionPossible(),
				editPermissionPossible: this.model.editPermissionPossible(),
				createPermissionPossible: this.model.createPermissionPossible(),
				updatePermissionPossible: this.model.updatePermissionPossible(),
				deletePermissionPossible: this.model.deletePermissionPossible(),
				sharePermission: OC.PERMISSION_SHARE,
				createPermission: OC.PERMISSION_CREATE,
				updatePermission: OC.PERMISSION_UPDATE,
				deletePermission: OC.PERMISSION_DELETE,
				readPermission: OC.PERMISSION_READ,
				isFolder: this.model.isFolder()
			};
		},

		/**
		 * get an array of sharees' share properties
		 *
		 * @returns {Array}
		 */
		getShareeList: function() {
			var universal = this.getShareProperties();

			if(!this.model.hasUserShares()) {
				return [];
			}

			var shares = this.model.get('shares');
			var list = [];
			for(var index = 0; index < shares.length; index++) {
				var share = this.getShareeObject(index);

				if (share.shareType === OC.Share.SHARE_TYPE_LINK) {
					continue;
				}
				// first empty {} is necessary, otherwise we get in trouble
				// with references
				list.push(_.extend({}, universal, share));
			}

			return list;
		},

		getLinkReshares: function() {
			var universal = {
				unshareLabel: t('core', 'Unshare'),
			};

			if(!this.model.hasUserShares()) {
				return [];
			}

			var shares = this.model.get('shares');
			var list = [];
			for(var index = 0; index < shares.length; index++) {
				var share = this.getShareeObject(index);

				if (share.shareType !== OC.Share.SHARE_TYPE_LINK) {
					continue;
				}
				// first empty {} is necessary, otherwise we get in trouble
				// with references
				list.push(_.extend({}, universal, share, {
					shareInitiator: shares[index].uid_owner,
					shareInitiatorDisplayName: shares[index].displayname_owner
				}));
			}

			return list;
		},

		render: function() {
			if(!this._renderPermissionChange) {
				this.$el.html(this.template({
					cid: this.cid,
					sharees: this.getShareeList(),
					linkReshares: this.getLinkReshares()
				}));

				this.$('.avatar').each(function () {
					var $this = $(this);
					if ($this.hasClass('imageplaceholderseed')) {
						$this.css({width: 32, height: 32});
						$this.imageplaceholder($this.data('seed'));
					} else {
						//                         user,   size,  ie8fix, hidedefault,  callback, displayname
						$this.avatar($this.data('username'), 32, undefined, undefined, undefined, $this.data('displayname'));
					}
				});

				this.$('.has-tooltip').tooltip({
					placement: 'bottom'
				});

				this.$('ul.shareWithList > li').each(function() {
					var $this = $(this);

					var shareWith = $this.data('share-with');
					var shareType = $this.data('share-type');

					$this.find('div.avatar, span.username').contactsMenu(shareWith, shareType, $this);
				});
			} else {
				var permissionChangeShareId = parseInt(this._renderPermissionChange, 10);
				var shareWithIndex = this.model.findShareWithIndex(permissionChangeShareId);
				var sharee = this.getShareeObject(shareWithIndex);
				$.extend(sharee, this.getShareProperties());
				var $li = this.$('li[data-share-id=' + permissionChangeShareId + ']');
				$li.find('.sharingOptionsGroup .popovermenu').replaceWith(this.popoverMenuTemplate(sharee));

				var checkBoxId = 'canEdit-' + this.cid + '-' + sharee.shareWith;
				checkBoxId = '#' + checkBoxId.replace( /(:|\.|\[|\]|,|=|@)/g, "\\$1");
				var $edit = $li.parent().find(checkBoxId);
				if($edit.length === 1) {
					$edit.prop('checked', sharee.hasEditPermission);
				}
			}

			var _this = this;
			this.$('.popovermenu').on('afterHide', function() {
				_this._menuOpen = false;
			});
			this.$('.popovermenu').on('beforeHide', function() {
				var shareId = parseInt(_this._menuOpen, 10);
				if(!_.isNaN(shareId)) {
					var datePickerClass = '.expirationDateContainer-' + _this.cid + '-' + shareId;
					var datePickerInput = '#expirationDatePicker-' + _this.cid + '-' + shareId;
					var expireDateCheckbox = '#expireDate-' + _this.cid + '-' + shareId;
					if ($(expireDateCheckbox).prop('checked')) {
						$(datePickerInput).removeClass('hidden-visually');
						$(datePickerClass).removeClass('hasDatepicker');
						$(datePickerClass + ' .ui-datepicker').hide();
					}
				}
			});
			if (this._menuOpen !== false) {
				// Open menu again if it was opened before
				var shareId = parseInt(this._menuOpen, 10);
				if(!_.isNaN(shareId)) {
					var liSelector = 'li[data-share-id=' + shareId + ']';
					OC.showMenu(null, this.$(liSelector + ' .sharingOptionsGroup .popovermenu'));
				}
			}

			this._renderPermissionChange = false;

			this.delegateEvents();

			return this;
		},

		/**
		 * @returns {Function} from Handlebars
		 * @private
		 */
		template: function (data) {
			if (!this._template) {
				this._template = Handlebars.compile(TEMPLATE);
			}
			var sharees = data.sharees;
			if(_.isArray(sharees)) {
				for (var i = 0; i < sharees.length; i++) {
					data.sharees[i].popoverMenu = this.popoverMenuTemplate(sharees[i]);
				}
			}
			return this._template(data);
		},

		/**
		 * renders the popover template and returns the resulting HTML
		 *
		 * @param {Object} data
		 * @returns {string}
		 */
		popoverMenuTemplate: function(data) {
			if(!this._popoverMenuTemplate) {
				this._popoverMenuTemplate = Handlebars.compile(TEMPLATE_POPOVER_MENU);
			}
			return this._popoverMenuTemplate(data);
		},

		onUnshare: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var self = this;
			var $element = $(event.target);
			if (!$element.is('a')) {
				$element = $element.closest('a');
			}

			var $loading = $element.find('.icon-loading-small').eq(0);
			if(!$loading.hasClass('hidden')) {
				// in process
				return false;
			}
			$loading.removeClass('hidden');

			var $li = $element.closest('li[data-share-id]');

			var shareId = $li.data('share-id');

			self.model.removeShare(shareId)
				.done(function() {
					$li.remove();
				})
				.fail(function() {
					$loading.addClass('hidden');
					OC.Notification.showTemporary(t('core', 'Could not unshare'));
				});
			return false;
		},

		onToggleMenu: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var $element = $(event.target);
			var $li = $element.closest('li[data-share-id]');
			var $menu = $li.find('.sharingOptionsGroup .popovermenu');

			OC.showMenu(null, $menu);
			this._menuOpen = $li.data('share-id');
		},

		onExpireDateChange: function(event) {
			var element = $(event.target);
			var li = element.closest('li[data-share-id]');
			var shareId = li.data('share-id');
			var datePickerClass = '.expirationDateContainer-' + this.cid + '-' + shareId;
			var datePicker = $(datePickerClass);
			var state = element.prop('checked');
			datePicker.toggleClass('hidden', !state);
			if (!state) {
				this.setExpirationDate(shareId, '');
			} else {
				this.showDatePicker(event);

			}
		},

		showDatePicker: function(event) {
			var element = $(event.target);
			var li = element.closest('li[data-share-id]');
			var shareId = li.data('share-id');
			var expirationDatePicker = '#expirationDatePicker-' + this.cid + '-' + shareId;
			var view = this;
			$(expirationDatePicker).datepicker({
				dateFormat : 'dd-mm-yy',
				onSelect: function (expireDate) {
					view.setExpirationDate(shareId, expireDate);
				}
			});
			$(expirationDatePicker).focus();

		},

		setExpirationDate: function(shareId, expireDate) {
			this.model.updateShare(shareId, {expireDate: expireDate}, {});
		},

		onMailSharePasswordProtectChange: function(event) {
			var element = $(event.target);
			var li = element.closest('li[data-share-id]');
			var shareId = li.data('share-id');
			var passwordContainerClass = '.passwordContainer-' + this.cid + '-' + shareId;
			var passwordContainer = $(passwordContainerClass);
			var loading = this.$el.find(passwordContainerClass + ' .icon-loading-small');
			var inputClass = '#passwordField-' + this.cid + '-' + shareId;
			var passwordField = $(inputClass);
			var state = element.prop('checked');
			if (!state) {
				this.model.updateShare(shareId, {password: ''});
				passwordField.attr('value', '');
				passwordField.removeClass('error');
				passwordField.tooltip('hide');
				loading.addClass('hidden');
				passwordField.attr('placeholder', PASSWORD_PLACEHOLDER_MESSAGE);
				// We first need to reset the password field before we hide it
				passwordContainer.toggleClass('hidden', !state);
			} else {
				passwordContainer.toggleClass('hidden', !state);
				passwordField = '#passwordField-' + this.cid + '-' + shareId;
				this.$(passwordField).focus();
			}
		},

		onMailSharePasswordKeyUp: function(event) {
			if(event.keyCode === 13) {
				this.onMailSharePasswordEntered(event);
			}
		},

		onMailSharePasswordEntered: function(event) {
			var passwordField = $(event.target);
			var li = passwordField.closest('li[data-share-id]');
			var shareId = li.data('share-id');
			var passwordContainerClass = '.passwordContainer-' + this.cid + '-' + shareId;
			var loading = this.$el.find(passwordContainerClass + ' .icon-loading-small');
			if (!loading.hasClass('hidden')) {
				// still in process
				return;
			}

			passwordField.removeClass('error');
			var password = passwordField.val();
			// in IE9 the password might be the placeholder due to bugs in the placeholders polyfill
			if(password === '' || password === PASSWORD_PLACEHOLDER || password === PASSWORD_PLACEHOLDER_MESSAGE) {
				return;
			}

			loading
				.removeClass('hidden')
				.addClass('inlineblock');


			this.model.updateShare(shareId, {
				password: password
			}, {
				error: function(model, msg) {
					// destroy old tooltips
					passwordField.tooltip('destroy');
					loading.removeClass('inlineblock').addClass('hidden');
					passwordField.addClass('error');
					passwordField.attr('title', msg);
					passwordField.tooltip({placement: 'bottom', trigger: 'manual'});
					passwordField.tooltip('show');
				},
				success: function(model, msg) {
					passwordField.blur();
					passwordField.attr('value', '');
					passwordField.attr('placeholder', PASSWORD_PLACEHOLDER);
					loading.removeClass('inlineblock').addClass('hidden');
				}
			});
		},

		onPermissionChange: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var $element = $(event.target);
			var $li = $element.closest('li[data-share-id]');
			var shareId = $li.data('share-id');

			var permissions = OC.PERMISSION_READ;

			if (this.model.isFolder()) {
				// adjust checkbox states
				var $checkboxes = $('.permissions', $li).not('input[name="edit"]').not('input[name="share"]');
				var checked;
				if ($element.attr('name') === 'edit') {
					checked = $element.is(':checked');
					// Check/uncheck Create, Update, and Delete checkboxes if Edit is checked/unck
					$($checkboxes).prop('checked', checked);
					if (checked) {
						permissions |= OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE | OC.PERMISSION_DELETE;
					}
				} else {
					var numberChecked = $checkboxes.filter(':checked').length;
					checked = numberChecked > 0;
					$('input[name="edit"]', $li).prop('checked', checked);
				}
			} else {
				if ($element.attr('name') === 'edit' && $element.is(':checked')) {
					permissions |= OC.PERMISSION_UPDATE;
				}
			}

			$('.permissions', $li).not('input[name="edit"]').filter(':checked').each(function(index, checkbox) {
				permissions |= $(checkbox).data('permissions');
			});


			/** disable checkboxes during save operation to avoid race conditions **/
			$li.find('input[type=checkbox]').prop('disabled', true);
			var enableCb = function() {
				$li.find('input[type=checkbox]').prop('disabled', false);
			};
			var errorCb = function(elem, msg) {
				OC.dialogs.alert(msg, t('core', 'Error while sharing'));
				enableCb();
			};

			this.model.updateShare(shareId, {permissions: permissions}, {error: errorCb, success: enableCb});

			this._renderPermissionChange = shareId;
		},

		onSecureDropChange: function(event) {
			event.preventDefault();
			event.stopPropagation();
			var $element = $(event.target);
			var $li = $element.closest('li[data-share-id]');
			var shareId = $li.data('share-id');

			var permissions = OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE | OC.PERMISSION_DELETE | OC.PERMISSION_READ;
			if ($element.is(':checked')) {
				permissions = OC.PERMISSION_CREATE | OC.PERMISSION_UPDATE | OC.PERMISSION_DELETE;
			}

			/** disable checkboxes during save operation to avoid race conditions **/
			$li.find('input[type=checkbox]').prop('disabled', true);
			var enableCb = function() {
				$li.find('input[type=checkbox]').prop('disabled', false);
			};
			var errorCb = function(elem, msg) {
				OC.dialogs.alert(msg, t('core', 'Error while sharing'));
				enableCb();
			};

			this.model.updateShare(shareId, {permissions: permissions}, {error: errorCb, success: enableCb});

			this._renderPermissionChange = shareId;
		}

	});

	OC.Share.ShareDialogShareeListView = ShareDialogShareeListView;

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

/* globals Handlebars */

(function() {
	if(!OC.Share) {
		OC.Share = {};
	}

	var TEMPLATE_BASE =
		'<div class="resharerInfoView subView"></div>' +
		'{{#if isSharingAllowed}}' +
		'<label for="shareWith-{{cid}}" class="hidden-visually">{{shareLabel}}</label>' +
		'<div class="oneline">' +
		'    <input id="shareWith-{{cid}}" class="shareWithField" type="text" placeholder="{{sharePlaceholder}}" />' +
		'    <span class="shareWithLoading icon-loading-small hidden"></span>'+
		'{{{shareInfo}}}' +
		'</div>' +
		'{{/if}}' +
		'<div class="shareeListView subView"></div>' +
		'<div class="linkShareView subView"></div>' +
		'<div class="expirationView subView"></div>' +
		'<div class="loading hidden" style="height: 50px"></div>';

	var TEMPLATE_SHARE_INFO =
		'<span class="icon icon-info shareWithRemoteInfo hasTooltip" ' +
		'title="{{tooltip}}"></span>';

	/**
	 * @class OCA.Share.ShareDialogView
	 * @member {OC.Share.ShareItemModel} model
	 * @member {jQuery} $el
	 * @memberof OCA.Sharing
	 * @classdesc
	 *
	 * Represents the GUI of the share dialogue
	 *
	 */
	var ShareDialogView = OC.Backbone.View.extend({
		/** @type {Object} **/
		_templates: {},

		/** @type {boolean} **/
		_showLink: true,

		/** @type {string} **/
		tagName: 'div',

		/** @type {OC.Share.ShareConfigModel} **/
		configModel: undefined,

		/** @type {object} **/
		resharerInfoView: undefined,

		/** @type {object} **/
		linkShareView: undefined,

		/** @type {object} **/
		expirationView: undefined,

		/** @type {object} **/
		shareeListView: undefined,

		events: {
			'focus .shareWithField': 'onShareWithFieldFocus',
			'input .shareWithField': 'onShareWithFieldChanged'
		},

		initialize: function(options) {
			var view = this;

			this.model.on('fetchError', function() {
				OC.Notification.showTemporary(t('core', 'Share details could not be loaded for this item.'));
			});

			if(!_.isUndefined(options.configModel)) {
				this.configModel = options.configModel;
			} else {
				throw 'missing OC.Share.ShareConfigModel';
			}

			this.configModel.on('change:isRemoteShareAllowed', function() {
				view.render();
			});
			this.model.on('change:permissions', function() {
				view.render();
			});

			this.model.on('request', this._onRequest, this);
			this.model.on('sync', this._onEndRequest, this);

			var subViewOptions = {
				model: this.model,
				configModel: this.configModel
			};

			var subViews = {
				resharerInfoView: 'ShareDialogResharerInfoView',
				linkShareView: 'ShareDialogLinkShareView',
				expirationView: 'ShareDialogExpirationView',
				shareeListView: 'ShareDialogShareeListView'
			};

			for(var name in subViews) {
				var className = subViews[name];
				this[name] = _.isUndefined(options[name])
					? new OC.Share[className](subViewOptions)
					: options[name];
			}

			_.bindAll(this,
				'autocompleteHandler',
				'_onSelectRecipient',
				'onShareWithFieldChanged',
				'onShareWithFieldFocus'
			);

			OC.Plugins.attach('OC.Share.ShareDialogView', this);
		},

		onShareWithFieldChanged: function() {
			var $el = this.$el.find('.shareWithField');
			if ($el.val().length < 2) {
				$el.removeClass('error').tooltip('hide');
			}
		},

		/* trigger search after the field was re-selected */
		onShareWithFieldFocus: function() {
			this.$el.find('.shareWithField').autocomplete("search");
		},

		autocompleteHandler: function (search, response) {
			var $shareWithField = $('.shareWithField'),
				view = this,
				$loading = this.$el.find('.shareWithLoading'),
				$shareInfo = this.$el.find('.shareWithRemoteInfo');

			var count = oc_config['sharing.minSearchStringLength'];
			if (search.term.trim().length < count) {
				var title = n('core',
					'At least {count} character is needed for autocompletion',
					'At least {count} characters are needed for autocompletion',
					count,
					{ count: count }
				);
				$shareWithField.addClass('error')
					.attr('data-original-title', title)
					.tooltip('hide')
					.tooltip({
						placement: 'bottom',
						trigger: 'manual'
					})
					.tooltip('fixTitle')
					.tooltip('show');
				response();
				return;
			}

			$loading.removeClass('hidden');
			$loading.addClass('inlineblock');
			$shareInfo.addClass('hidden');

			$shareWithField.removeClass('error')
				.tooltip('hide');

			var perPage = 200;
			$.get(
				OC.linkToOCS('apps/files_sharing/api/v1') + 'sharees',
				{
					format: 'json',
					search: search.term.trim(),
					perPage: perPage,
					itemType: view.model.get('itemType')
				},
				function (result) {
					$loading.addClass('hidden');
					$loading.removeClass('inlineblock');
					$shareInfo.removeClass('hidden');
					if (result.ocs.meta.statuscode === 100) {
						var users   = result.ocs.data.exact.users.concat(result.ocs.data.users);
						var groups  = result.ocs.data.exact.groups.concat(result.ocs.data.groups);
						var remotes = result.ocs.data.exact.remotes.concat(result.ocs.data.remotes);
						var lookup = result.ocs.data.lookup;
						var emails = [],
							circles = [];
						if (typeof(result.ocs.data.emails) !== 'undefined') {
							emails = result.ocs.data.exact.emails.concat(result.ocs.data.emails);
						}
						if (typeof(result.ocs.data.circles) !== 'undefined') {
							circles = result.ocs.data.exact.circles.concat(result.ocs.data.circles);
						}

						var usersLength;
						var groupsLength;
						var remotesLength;
						var emailsLength;
						var circlesLength;

						var i, j;

						//Filter out the current user
						usersLength = users.length;
						for (i = 0; i < usersLength; i++) {
							if (users[i].value.shareWith === OC.currentUser) {
								users.splice(i, 1);
								break;
							}
						}

						// Filter out the owner of the share
						if (view.model.hasReshare()) {
							usersLength = users.length;
							for (i = 0 ; i < usersLength; i++) {
								if (users[i].value.shareWith === view.model.getReshareOwner()) {
									users.splice(i, 1);
									break;
								}
							}
						}

						var shares = view.model.get('shares');
						var sharesLength = shares.length;

						// Now filter out all sharees that are already shared with
						for (i = 0; i < sharesLength; i++) {
							var share = shares[i];

							if (share.share_type === OC.Share.SHARE_TYPE_USER) {
								usersLength = users.length;
								for (j = 0; j < usersLength; j++) {
									if (users[j].value.shareWith === share.share_with) {
										users.splice(j, 1);
										break;
									}
								}
							} else if (share.share_type === OC.Share.SHARE_TYPE_GROUP) {
								groupsLength = groups.length;
								for (j = 0; j < groupsLength; j++) {
									if (groups[j].value.shareWith === share.share_with) {
										groups.splice(j, 1);
										break;
									}
								}
							} else if (share.share_type === OC.Share.SHARE_TYPE_REMOTE) {
								remotesLength = remotes.length;
								for (j = 0; j < remotesLength; j++) {
									if (remotes[j].value.shareWith === share.share_with) {
										remotes.splice(j, 1);
										break;
									}
								}
							} else if (share.share_type === OC.Share.SHARE_TYPE_EMAIL) {
								emailsLength = emails.length;
								for (j = 0; j < emailsLength; j++) {
									if (emails[j].value.shareWith === share.share_with) {
										emails.splice(j, 1);
										break;
									}
								}
							} else if (share.share_type === OC.Share.SHARE_TYPE_CIRCLE) {
								circlesLength = circles.length;
								for (j = 0; j < circlesLength; j++) {
									if (circles[j].value.shareWith === share.share_with) {
										circles.splice(j, 1);
										break;
									}
								}
							}
						}

						var suggestions = users.concat(groups).concat(remotes).concat(emails).concat(circles).concat(lookup);

						if (suggestions.length > 0) {
							$shareWithField
								.autocomplete("option", "autoFocus", true);

							response(suggestions);

							// show a notice that the list is truncated
							// this is the case if one of the search results is at least as long as the max result config option
							if(oc_config['sharing.maxAutocompleteResults'] > 0 &&
								Math.min(perPage, oc_config['sharing.maxAutocompleteResults'])
								<= Math.max(users.length, groups.length, remotes.length, emails.length, lookup.length)) {

								var message = t('core', 'This list is maybe truncated - please refine your search term to see more results.');
								$('.ui-autocomplete').append('<li class="autocomplete-note">' + message + '</li>');
							}

						} else {
							var title = t('core', 'No users or groups found for {search}', {search: $shareWithField.val()});
							if (!view.configModel.get('allowGroupSharing')) {
								title = t('core', 'No users found for {search}', {search: $('.shareWithField').val()});
							}
							$shareWithField.addClass('error')
								.attr('data-original-title', title)
								.tooltip('hide')
								.tooltip({
									placement: 'bottom',
									trigger: 'manual'
								})
								.tooltip('fixTitle')
								.tooltip('show');
							response();
						}
					} else {
						response();
					}
				}
			).fail(function() {
				$loading.addClass('hidden');
				$loading.removeClass('inlineblock');
				$shareInfo.removeClass('hidden');
				OC.Notification.show(t('core', 'An error occurred. Please try again'));
				window.setTimeout(OC.Notification.hide, 5000);
			});
		},

		autocompleteRenderItem: function(ul, item) {

			var text = item.label;
			if (item.value.shareType === OC.Share.SHARE_TYPE_GROUP) {
				text = t('core', '{sharee} (group)', { sharee: text }, undefined, { escape: false });
			} else if (item.value.shareType === OC.Share.SHARE_TYPE_REMOTE) {
				text = t('core', '{sharee} (remote)', { sharee: text }, undefined, { escape: false });
			} else if (item.value.shareType === OC.Share.SHARE_TYPE_EMAIL) {
				text = t('core', '{sharee} (email)', { sharee: text }, undefined, { escape: false });
			} else if (item.value.shareType === OC.Share.SHARE_TYPE_CIRCLE) {
				text = t('core', '{sharee} ({type}, {owner})', {sharee: text, type: item.value.circleInfo, owner: item.value.circleOwner}, undefined, {escape: false});
			}
			var insert = $("<div class='share-autocomplete-item'/>");
			var avatar = $("<div class='avatardiv'></div>").appendTo(insert);
			if (item.value.shareType === OC.Share.SHARE_TYPE_USER) {
				avatar.avatar(item.value.shareWith, 32, undefined, undefined, undefined, item.label);
			} else {
				avatar.imageplaceholder(text, undefined, 32);
			}

			$("<div class='autocomplete-item-text'></div>")
				.text(text)
				.appendTo(insert);
			insert.attr('title', item.value.shareWith);
			insert = $("<a>")
				.append(insert);
			return $("<li>")
				.addClass((item.value.shareType === OC.Share.SHARE_TYPE_GROUP) ? 'group' : 'user')
				.append(insert)
				.appendTo(ul);
		},

		_onSelectRecipient: function(e, s) {
			e.preventDefault();
			$(e.target).attr('disabled', true)
				.val(s.item.label);
			var $loading = this.$el.find('.shareWithLoading');
			$loading.removeClass('hidden')
				.addClass('inlineblock');
			var $shareInfo = this.$el.find('.shareWithRemoteInfo');
			$shareInfo.addClass('hidden');

			this.model.addShare(s.item.value, {success: function() {
				$(e.target).val('')
					.attr('disabled', false);
				$loading.addClass('hidden')
					.removeClass('inlineblock');
				$shareInfo.removeClass('hidden');
			}, error: function(obj, msg) {
				OC.Notification.showTemporary(msg);
				$(e.target).attr('disabled', false)
					.autocomplete('search', $(e.target).val());
				$loading.addClass('hidden')
					.removeClass('inlineblock');
				$shareInfo.removeClass('hidden');
			}});
		},

		_toggleLoading: function(state) {
			this._loading = state;
			this.$el.find('.subView').toggleClass('hidden', state);
			this.$el.find('.loading').toggleClass('hidden', !state);
		},

		_onRequest: function() {
			// only show the loading spinner for the first request (for now)
			if (!this._loadingOnce) {
				this._toggleLoading(true);
			}
		},

		_onEndRequest: function() {
			var self = this;
			this._toggleLoading(false);
			if (!this._loadingOnce) {
				this._loadingOnce = true;
				// the first time, focus on the share field after the spinner disappeared
				if (!OC.Util.isIE()) {
					_.defer(function () {
						self.$('.shareWithField').focus();
					});
				}
			}
		},

		render: function() {
			var baseTemplate = this._getTemplate('base', TEMPLATE_BASE);

			this.$el.html(baseTemplate({
				cid: this.cid,
				shareLabel: t('core', 'Share'),
				sharePlaceholder: this._renderSharePlaceholderPart(),
				shareInfo: this._renderShareInfoPart(),
				isSharingAllowed: this.model.sharePermissionPossible()
			}));

			var $shareField = this.$el.find('.shareWithField');
			if ($shareField.length) {
				$shareField.autocomplete({
					minLength: 1,
					delay: 750,
					focus: function(event) {
						event.preventDefault();
					},
					source: this.autocompleteHandler,
					select: this._onSelectRecipient
				}).data('ui-autocomplete')._renderItem = this.autocompleteRenderItem;
			}

			this.resharerInfoView.$el = this.$el.find('.resharerInfoView');
			this.resharerInfoView.render();

			this.linkShareView.$el = this.$el.find('.linkShareView');
			this.linkShareView.render();

			this.expirationView.$el = this.$el.find('.expirationView');
			this.expirationView.render();

			this.shareeListView.$el = this.$el.find('.shareeListView');
			this.shareeListView.render();

			this.$el.find('.hasTooltip').tooltip();

			return this;
		},

		/**
		 * sets whether share by link should be displayed or not. Default is
		 * true.
		 *
		 * @param {bool} showLink
		 */
		setShowLink: function(showLink) {
			this._showLink = (typeof showLink === 'boolean') ? showLink : true;
			this.linkShareView.showLink = this._showLink;
		},

		_renderShareInfoPart: function() {
			var shareInfo = '';
			var infoTemplate = this._getShareInfoTemplate();

			if(this.configModel.get('isMailShareAllowed') && this.configModel.get('isRemoteShareAllowed')) {
				shareInfo = infoTemplate({
					tooltip: t('core', 'Share with other people by entering a user or group, a federated cloud ID or an email address.')
				});
			} else if(this.configModel.get('isRemoteShareAllowed')) {
				shareInfo = infoTemplate({
					tooltip: t('core', 'Share with other people by entering a user or group or a federated cloud ID.')
				});
			} else if(this.configModel.get('isMailShareAllowed')) {
				shareInfo = infoTemplate({
					tooltip: t('core', 'Share with other people by entering a user or group or an email address.')
				});
			}

			return shareInfo;
		},

		_renderSharePlaceholderPart: function () {
			var allowRemoteSharing = this.configModel.get('isRemoteShareAllowed');
			var allowMailSharing = this.configModel.get('isMailShareAllowed');

			if (!allowRemoteSharing && allowMailSharing) {
				return t('core', 'Name or email address...');
			}
			if (allowRemoteSharing && !allowMailSharing) {
				return t('core', 'Name or federated cloud ID...');
			}
			if (allowRemoteSharing && allowMailSharing) {
				return t('core', 'Name, federated cloud ID or email address...');
			}

			return 	t('core', 'Name...');
		},

		/**
		 *
		 * @param {string} key - an identifier for the template
		 * @param {string} template - the HTML to be compiled by Handlebars
		 * @returns {Function} from Handlebars
		 * @private
		 */
		_getTemplate: function (key, template) {
			if (!this._templates[key]) {
				this._templates[key] = Handlebars.compile(template);
			}
			return this._templates[key];
		},

		/**
		 * returns the info template for remote sharing
		 *
		 * @returns {Function}
		 * @private
		 */
		_getShareInfoTemplate: function() {
			return this._getTemplate('shareInfo', TEMPLATE_SHARE_INFO);
		}
	});

	OC.Share.ShareDialogView = ShareDialogView;

})();


/* global escapeHTML */

/**
 * @namespace
 */
OC.Share = _.extend(OC.Share || {}, {
	SHARE_TYPE_USER:0,
	SHARE_TYPE_GROUP:1,
	SHARE_TYPE_LINK:3,
	SHARE_TYPE_EMAIL:4,
	SHARE_TYPE_REMOTE:6,
	SHARE_TYPE_CIRCLE:7,
	SHARE_TYPE_GUEST:8,

	/**
	 * Regular expression for splitting parts of remote share owners:
	 * "user@example.com/path/to/owncloud"
	 * "user@anotherexample.com@example.com/path/to/owncloud
	 */
	_REMOTE_OWNER_REGEXP: new RegExp("^([^@]*)@(([^@]*)@)?([^/]*)([/](.*)?)?$"),

	/**
	 * @deprecated use OC.Share.currentShares instead
	 */
	itemShares:[],
	/**
	 * Full list of all share statuses
	 */
	statuses:{},
	/**
	 * Shares for the currently selected file.
	 * (for which the dropdown is open)
	 *
	 * Key is item type and value is an array or
	 * shares of the given item type.
	 */
	currentShares: {},
	/**
	 * Whether the share dropdown is opened.
	 */
	droppedDown:false,
	/**
	 * Loads ALL share statuses from server, stores them in
	 * OC.Share.statuses then calls OC.Share.updateIcons() to update the
	 * files "Share" icon to "Shared" according to their share status and
	 * share type.
	 *
	 * If a callback is specified, the update step is skipped.
	 *
	 * @param itemType item type
	 * @param fileList file list instance, defaults to OCA.Files.App.fileList
	 * @param callback function to call after the shares were loaded
	 */
	loadIcons:function(itemType, fileList, callback) {
		var path = fileList.dirInfo.path;
		if (path === '/') {
			path = '';
		}
		path += '/' + fileList.dirInfo.name;

		// Load all share icons
		$.get(
			OC.linkToOCS('apps/files_sharing/api/v1', 2) + 'shares',
			{
				subfiles: 'true',
				path: path,
				format: 'json'
			}, function(result) {
				if (result && result.ocs.meta.statuscode === 200) {
					OC.Share.statuses = {};
					$.each(result.ocs.data, function(it, share) {
						if (!(share.item_source in OC.Share.statuses)) {
							OC.Share.statuses[share.item_source] = {link: false};
						}
						if (share.share_type === OC.Share.SHARE_TYPE_LINK) {
							OC.Share.statuses[share.item_source] = {link: true};
						}
					});
					if (_.isFunction(callback)) {
						callback(OC.Share.statuses);
					} else {
						OC.Share.updateIcons(itemType, fileList);
					}
				}
			}
		);
	},
	/**
	 * Updates the files' "Share" icons according to the known
	 * sharing states stored in OC.Share.statuses.
	 * (not reloaded from server)
	 *
	 * @param itemType item type
	 * @param fileList file list instance
	 * defaults to OCA.Files.App.fileList
	 */
	updateIcons:function(itemType, fileList){
		var item;
		var $fileList;
		var currentDir;
		if (!fileList && OCA.Files) {
			fileList = OCA.Files.App.fileList;
		}
		// fileList is usually only defined in the files app
		if (fileList) {
			$fileList = fileList.$fileList;
			currentDir = fileList.getCurrentDirectory();
		}
		// TODO: iterating over the files might be more efficient
		for (item in OC.Share.statuses){
			var iconClass = 'icon-shared';
			var data = OC.Share.statuses[item];
			var hasLink = data.link;
			// Links override shared in terms of icon display
			if (hasLink) {
				iconClass = 'icon-public';
			}
			if (itemType !== 'file' && itemType !== 'folder') {
				$('a.share[data-item="'+item+'"] .icon').removeClass('icon-shared icon-public').addClass(iconClass);
			} else {
				// TODO: ultimately this part should be moved to files_sharing app
				var file = $fileList.find('tr[data-id="'+item+'"]');
				var shareFolder = OC.imagePath('core', 'filetypes/folder-shared');
				var img;
				if (file.length > 0) {
					this.markFileAsShared(file, true, hasLink);
				} else {
					var dir = currentDir;
					if (dir.length > 1) {
						var last = '';
						var path = dir;
						// Search for possible parent folders that are shared
						while (path != last) {
							if (path === data.path && !data.link) {
								var actions = $fileList.find('.fileactions .action[data-action="Share"]');
								var files = $fileList.find('.filename');
								var i;
								for (i = 0; i < actions.length; i++) {
									// TODO: use this.markFileAsShared()
									img = $(actions[i]).find('img');
									if (img.attr('src') !== OC.imagePath('core', 'actions/public')) {
										img.attr('src', image);
										$(actions[i]).addClass('permanent');
										$(actions[i]).html('<span> '+t('core', 'Shared')+'</span>').prepend(img);
									}
								}
								for(i = 0; i < files.length; i++) {
									if ($(files[i]).closest('tr').data('type') === 'dir') {
										$(files[i]).find('.thumbnail').css('background-image', 'url('+shareFolder+')');
									}
								}
							}
							last = path;
							path = OC.Share.dirname(path);
						}
					}
				}
			}
		}
	},
	updateIcon:function(itemType, itemSource) {
		var shares = false;
		var link = false;
		var iconClass = '';
		$.each(OC.Share.itemShares, function(index) {
			if (OC.Share.itemShares[index]) {
				if (index == OC.Share.SHARE_TYPE_LINK) {
					if (OC.Share.itemShares[index] == true) {
						shares = true;
						iconClass = 'icon-public';
						link = true;
						return;
					}
				} else if (OC.Share.itemShares[index].length > 0) {
					shares = true;
					iconClass = 'icon-shared';
				}
			}
		});
		if (itemType != 'file' && itemType != 'folder') {
			$('a.share[data-item="'+itemSource+'"] .icon').removeClass('icon-shared icon-public').addClass(iconClass);
		} else {
			var $tr = $('tr').filterAttr('data-id', String(itemSource));
			if ($tr.length > 0) {
				// it might happen that multiple lists exist in the DOM
				// with the same id
				$tr.each(function() {
					OC.Share.markFileAsShared($(this), shares, link);
				});
			}
		}
		if (shares) {
			OC.Share.statuses[itemSource] = OC.Share.statuses[itemSource] || {};
			OC.Share.statuses[itemSource].link = link;
		} else {
			delete OC.Share.statuses[itemSource];
		}
	},
	/**
	 * Format a remote address
	 *
	 * @param {String} shareWith userid, full remote share, or whatever
	 * @param {String} shareWithDisplayName
	 * @param {String} message
	 * @return {String} HTML code to display
	 */
	_formatRemoteShare: function(shareWith, shareWithDisplayName, message) {
		var parts = this._REMOTE_OWNER_REGEXP.exec(shareWith);
		if (!parts) {
			// display avatar of the user
			var avatar = '<span class="avatar" data-username="' + escapeHTML(shareWith) + '" title="' + message + " " + escapeHTML(shareWithDisplayName) + '"></span>';
			var hidden = '<span class="hidden-visually">' + message + ' ' + escapeHTML(shareWithDisplayName) + '</span> ';
			return avatar + hidden;
		}

		var userName = parts[1];
		var userDomain = parts[3];
		var server = parts[4];
		var tooltip = message + ' ' + userName;
		if (userDomain) {
			tooltip += '@' + userDomain;
		}
		if (server) {
			if (!userDomain) {
				userDomain = '…';
			}
			tooltip += '@' + server;
		}

		var html = '<span class="remoteAddress" title="' + escapeHTML(tooltip) + '">';
		html += '<span class="username">' + escapeHTML(userName) + '</span>';
		if (userDomain) {
			html += '<span class="userDomain">@' + escapeHTML(userDomain) + '</span>';
		}
		html += '</span> ';
		return html;
	},
	/**
	 * Loop over all recipients in the list and format them using
	 * all kind of fancy magic.
	 *
	 * @param {Object} recipients array of all the recipients
	 * @return {String[]} modified list of recipients
	 */
	_formatShareList: function(recipients) {
		var _parent = this;
		recipients = _.toArray(recipients);
		recipients.sort(function(a, b) {
			return a.shareWithDisplayName.localeCompare(b.shareWithDisplayName);
		});
		return $.map(recipients, function(recipient) {
			return _parent._formatRemoteShare(recipient.shareWith, recipient.shareWithDisplayName, t('core', 'Shared with'));
		});
	},
	/**
	 * Marks/unmarks a given file as shared by changing its action icon
	 * and folder icon.
	 *
	 * @param $tr file element to mark as shared
	 * @param hasShares whether shares are available
	 * @param hasLink whether link share is available
	 */
	markFileAsShared: function($tr, hasShares, hasLink) {
		var action = $tr.find('.fileactions .action[data-action="Share"]');
		var type = $tr.data('type');
		var icon = action.find('.icon');
		var message, recipients, avatars;
		var ownerId = $tr.attr('data-share-owner-id');
		var owner = $tr.attr('data-share-owner');
		var shareFolderIcon;
		var iconClass = 'icon-shared';
		action.removeClass('shared-style');
		// update folder icon
		if (type === 'dir' && (hasShares || hasLink || ownerId)) {
			if (hasLink) {
				shareFolderIcon = OC.MimeType.getIconUrl('dir-public');
			}
			else {
				shareFolderIcon = OC.MimeType.getIconUrl('dir-shared');
			}
			$tr.find('.filename .thumbnail').css('background-image', 'url(' + shareFolderIcon + ')');
			$tr.attr('data-icon', shareFolderIcon);
		} else if (type === 'dir') {
			var isEncrypted = $tr.attr('data-e2eencrypted');
			var mountType = $tr.attr('data-mounttype');
			// FIXME: duplicate of FileList._createRow logic for external folder,
			// need to refactor the icon logic into a single code path eventually
			if (isEncrypted === 'true') {
				shareFolderIcon = OC.MimeType.getIconUrl('dir-encrypted');
				$tr.attr('data-icon', shareFolderIcon);
			} else if (mountType && mountType.indexOf('external') === 0) {
				shareFolderIcon = OC.MimeType.getIconUrl('dir-external');
				$tr.attr('data-icon', shareFolderIcon);
			} else {
				shareFolderIcon = OC.MimeType.getIconUrl('dir');
				// back to default
				$tr.removeAttr('data-icon');
			}
			$tr.find('.filename .thumbnail').css('background-image', 'url(' + shareFolderIcon + ')');
		}
		// update share action text / icon
		if (hasShares || ownerId) {
			recipients = $tr.data('share-recipient-data');
			action.addClass('shared-style');

			avatars = '<span>' + t('core', 'Shared') + '</span>';
			// even if reshared, only show "Shared by"
			if (ownerId) {
				message = t('core', 'Shared by');
				avatars = this._formatRemoteShare(ownerId, owner, message);
			} else if (recipients) {
				avatars = this._formatShareList(recipients);
			}
			action.html(avatars).prepend(icon);

			if (ownerId || recipients) {
				var avatarElement = action.find('.avatar');
				avatarElement.each(function () {
					$(this).avatar($(this).data('username'), 32);
				});
				action.find('span[title]').tooltip({placement: 'top'});
			}
		} else {
			action.html('<span class="hidden-visually">' + t('core', 'Shared') + '</span>').prepend(icon);
		}
		if (hasLink) {
			iconClass = 'icon-public';
		}
		icon.removeClass('icon-shared icon-public').addClass(iconClass);
	},
	showDropDown:function(itemType, itemSource, appendTo, link, possiblePermissions, filename) {
		var configModel = new OC.Share.ShareConfigModel();
		var attributes = {itemType: itemType, itemSource: itemSource, possiblePermissions: possiblePermissions};
		var itemModel = new OC.Share.ShareItemModel(attributes, {configModel: configModel});
		var dialogView = new OC.Share.ShareDialogView({
			id: 'dropdown',
			model: itemModel,
			configModel: configModel,
			className: 'drop shareDropDown',
			attributes: {
				'data-item-source-name': filename,
				'data-item-type': itemType,
				'data-item-source': itemSource
			}
		});
		dialogView.setShowLink(link);
		var $dialog = dialogView.render().$el;
		$dialog.appendTo(appendTo);
		$dialog.slideDown(OC.menuSpeed, function() {
			OC.Share.droppedDown = true;
		});
		itemModel.fetch();
	},
	hideDropDown:function(callback) {
		OC.Share.currentShares = null;
		$('#dropdown').slideUp(OC.menuSpeed, function() {
			OC.Share.droppedDown = false;
			$('#dropdown').remove();
			if (typeof FileActions !== 'undefined') {
				$('tr').removeClass('mouseOver');
			}
			if (callback) {
				callback.call();
			}
		});
	},
	dirname:function(path) {
		return path.replace(/\\/g,'/').replace(/\/[^\/]*$/, '');
	}
});

$(document).ready(function() {
	if(typeof monthNames != 'undefined'){
		// min date should always be the next day
		var minDate = new Date();
		minDate.setDate(minDate.getDate()+1);
		$.datepicker.setDefaults({
			monthNames: monthNames,
			monthNamesShort: monthNamesShort,
			dayNames: dayNames,
			dayNamesMin: dayNamesMin,
			dayNamesShort: dayNamesShort,
			firstDay: firstDay,
			minDate : minDate
		});
	}

	$(this).click(function(event) {
		var target = $(event.target);
		var isMatched = !target.is('.drop, .ui-datepicker-next, .ui-datepicker-prev, .ui-icon')
			&& !target.closest('#ui-datepicker-div').length && !target.closest('.ui-autocomplete').length;
		if (OC.Share && OC.Share.droppedDown && isMatched && $('#dropdown').has(event.target).length === 0) {
			OC.Share.hideDropDown();
		}
	});



});


