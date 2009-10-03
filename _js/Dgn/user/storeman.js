// Charset:utf-8 Tab:4
/*
 * Degino Ver.1
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

// ************************
// ユーザーモード用 JsonStore
// ************************

Dgn.UserStore = function(cfg) {
	Ext.applyIf(cfg, {
		url:		'/UserAjax',
		root:		'recs',
		autoLoad:	true
	});
    // call parent
	Dgn.UserStore.superclass.constructor.apply(this, arguments);

	// attach events
	this.on('reqappend', this.onRequestAppend, this);
};
Ext.extend(Dgn.UserStore, Ext.data.JsonStore, {
	onRequestAppend: function() {		// レコード追加リクエスト
		var RecCreator	= Ext.data.Record.create(this.fields.items);

		// 初期値データ作成
		var inival = {};
		Ext.each(this.fields.items, function(it, i, items) {
			if (it.name == '_id') {
				inival[it.name]	= 0;
			} else {
				switch (it.type) {
				case 'int':
				case 'float':
					inival[it.name]	= 0;
					break;
				case 'date':
					inival[it.name]	= new Date();
					break;
				default:
					inival[it.name]	= '';
					break;
				}
			}
		}, this);

		this.add(new RecCreator(inival));
	}
});

// *************************
// レコード用ストア定義
// *************************

var storeman = {
	// 保存用データ変換 (日付型対策)
	adjust: function(obj, elements) {
		var ret = {};

		// 日付書式辞書作成
		var formats = {};
		Ext.each(elements, function(it, i, items) {
			if (it.type == 'date') {
				formats[it.name] = it.dateFormat;
			}
		});

		// 日付項目の書式化
		for (it in obj) {
			if (Ext.isDate(obj[it])) {
				ret[it] = obj[it].format(formats[it]);
			} else {
				ret[it] = obj[it];
			}
		}

		return ret;
	},
	// ストア取得
	get: function(file_id, elements) {
		var that = this;

		var store = Ext.StoreMgr.get('Store' + file_id);
		
		if (!store) {
			// 追加イベントハンドラー
			var func_add = function(store, recs, index) {
				Ext.each(recs, function(rec, i, items) {
					var params = {_MSG: '_ADD', _MODEL: 'RECORD', _PARENT: file_id};
					params = Ext.apply(params, that.adjust(rec.data, elements));
					Ext.Ajax.request({
						method:		'POST',
						url:		'/UserAjax',
						params:		params,
						failure:	failure_dialogue,
						success:	function(response, options) {
					 		var ret	= Ext.util.JSON.decode(response.responseText);
	
							rec.beginEdit();
							for (var it in ret) {
								if (it != 'success') {
									rec.set(it, ret[it]);
								}
							}
							rec.endEdit();
	
							log('repaired to right id.');
						}
					});
				}, this);
			};
	
			// 削除イベントハンドラー
			var func_remove = function(store, rec, index) {
				var params = {_MSG:'_REMOVE', _MODEL: 'RECORD', _id: rec.get('_id')};
				// Ajax による削除処理
				Ext.Ajax.request({
					method:		'POST',
					url:		'/UserAjax',
					params:		params,
					failure:	failure_dialogue
				});
			};
	
			// 更新イベントハンドラー
			var func_update = function(store, rec, ope) {
				// TODO: store.save (3.0) を使って書き換えた方がいいか?
				var params = {_MSG: '_UPDATE', _MODEL: 'RECORD', _id: rec.get('_id')};

				var changes = rec.getChanges();
				Ext.apply(params, that.adjust(changes, elements));
	
				// 保存処理
				Ext.Ajax.request({
					method:		'POST',
					url:		'/UserAjax',
					params:		params,
					success:	function(response, options) {log('Saved!');},
					failure:	failure_dialogue
				});
			};
	
			store = new Dgn.UserStore({
				storeId:	'Store' + file_id,
				baseParams:	{_MSG: '_LIST', _MODEL: 'Record', _PARENT: file_id},
				fields:		elements,
				listeners:	{
					add:	func_add,
					remove:	func_remove,
					update:	func_update
				}
			});
		}
		
		return store;
	},
	get2: function(config) {
		var that = this;

		var store = Ext.StoreMgr.get(config.storeId);
		
		if (!store) {
			store = new Dgn.UserStore(config);
		}
		
		return store;
	}
};
