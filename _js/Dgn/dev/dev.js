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
// ストア定義
// ************************

var stores = {
	config: {
		Base: {fields: [
			'_id', 'owner_id', 'owner_name', 'disabled',
			{name:'created', type:'date', dateFormat:'Y.n.j G:i:s'},
			{name:'updated', type:'date', dateFormat:'Y.n.j G:i:s'}
		]},
		Table: {
			type:		'json',
			autoLoad:	true,
		 	fields:		['title', 'isPublic', 'remark']
		},
		Element: {
			type:		'json',
			autoLoad:	false,
			fields:		['name', 'f_type', 'isRequired', 'option', 'remark']
		},
		Element2: {
			type:		'json',
			autoLoad:	false,
			fields:		['name', 'f_type', 'isRequired', 'option', 'remark']
		},
		File: {
			type:		'json',
			autoLoad:	true,
			fields:		['table_id', 'name', 'isPublic', 'remark']
		},
		Appli: {
			type:		'json',
			autoLoad:	true,
			fields:		['label', 'isPublic', 'remark']
		},
		Channel: {
			type:		'json',
			autoLoad:	false,
			fields:		['appli_id', 'title', 'channeltype', 'remark']
		},
		Panel: {
			type:		'json',
			autoLoad:	false,
			fields:		[
				'title',
				{name:'file_id',	type:'int'},
				{name:'channel_id',	type:'int'},
				{name:'paneltype',	type:'int'},
				{name:'edittype',	type:'int'},
				{name:'filtertype',	type:'int'},
				'remark'
			]
		}
	},
	hdl_add: function(model) {
		// add イベント用ハンドラー
		return function(store, recs, index) {
			Ext.each(recs, function(it, i, index) {
				var params = {_MSG: 'ADD', _MODEL: model};
				Ext.apply(params, it.data);

				// 追加処理
				Ext.Ajax.request({
					method:		'POST',
					url:		'/DevAjax',
					params:		params,
					success:	function(response, options) {
						// サーバーが返す id をセット
				 		var ret	= Ext.util.JSON.decode(response.responseText);
				 		// TODO: イベント通知を止めるための begin, end が効いてない。
/*
						it.beginEdit();
						it.set('_id', ret['_id']);
						it.endEdit();
*/
						it.data._id = ret._id;		// いいのか?
						log('Repaired to right id.');
					},
					failure:	failure_dialogue
				});
			}, this);
		};
	},
	hdl_update: function(model) {
		// update イベント用ハンドラー
		return function(store, rec, ope) {
			if (!rec.dirty) {
				return;
			}
			// Ajax 用パラメータの設定
			var changed = rec.getChanges();
			Ext.apply(changed, {_MSG: 'UPDATE', _MODEL: model, _id: rec.get('_id')});

			// Ajax による保存処理
			Ext.Ajax.request({
				method:		'POST',
				url:		'/DevAjax',
				params:		changed,
				success:	function(response, options) {rec.commit(); log('Saved!');},
				failure:	failure_dialogue
			});
		};
	},
	hdl_remove: function(model) {
		return function(store, rec, index) {
			var params = {_MSG:'REMOVE', _MODEL: model, _id: rec.get('_id')};
			// Ajax による削除処理
			Ext.Ajax.request({
				method:		'POST',
				url:		'/DevAjax',
				params:		params,
				failure:	failure_dialogue
			});
		};
	},
	jsonstore: function(key, autoLoad) {
		var store = new Dgn.DevStore({
			storeId:	'Store' + key,
			autoLoad:	autoLoad,
			baseParams:	{_MSG: 'SELECT', _MODEL: key},
			fields:		stores.config.Base.fields.concat(stores.config[key].fields),
			listeners:	{
				add:	stores.hdl_add(key),
				update:	stores.hdl_update(key),
				remove:	stores.hdl_remove(key)
			}
		});
		
		// 全チャネルに appli_id が割り当てられるまでの一時的ロジック
		if (key == 'Appli') {
			store.on('load', function(store, recs, opts) {
				if (store.getCount() === 0) {
					Ext.Msg.alert('注意', 'もし、これまでに作成したチャネルがあれば、最初に追加したアプリのチャネルとなります。');
					var rebuild = function (store, recs, index) {
						Ext.Ajax.request({
							method:		'POST',
							url:		'/DevAjax',
							params:		{_MSG:'REBUILD', _MODEL: 'Channel'},
							failure:	failure_dialogue
						});
					};
					store.on('add', rebuild, this, {single:true, delay: 100});
				}
			});
		}
		
		return store;
	},
	get:	function(key) {
		var store	= getStore(key);
		// 既存でなければ生成
		if (!store) {
			var funcs = {
				json:	this.jsonstore
			};
			store = funcs[this.config[key].type](key, this.config[key].autoLoad);
		}
		
		return store;
	}
};

Dgn.DevApp = function(cfg) {
	Dgn.DevApp.superclass.constructor.apply(this, arguments);

	this.devmenu	= new Dgn.Devmenu({app: this});
};
Ext.extend(Dgn.DevApp, Dgn.AbstractApp, {
	initApp: function() {
		Dgn.DevApp.superclass.initApp.apply(this, arguments);

		var hdls = {
			top: function(btn, evt) {
				location.replace('/Auth');
			}
		};

		var temp = new Ext.Viewport({
			layout:		'border',
			defaults:	{border: false},
			items:	[{
				region:		'north',
				height:		62,
				baseCls:	'page_header',
				html:		'<div align="right">作成モード</div>'
			}, {
				region:		'center',
				layout:		'fit',
				items:		this.devmenu,
				tbar:	[
					{text: '戻る',		iconCls: 'btn_return', handler: hdls.top},
					'->',
					{text: 'ログアウト',	handler: logout}
				]
			}, {
				region:		'south',
				height:		30,
				baseCls:	'page_footer',
				html:		'<p align="center" font="smaller">Copyright &copy; 2009 Degino All rights reserved.</p>'
			}]
		});
	
		log('Hello');
	}
});

Ext.onReady(function(){
	var app = new Dgn.DevApp();
	app.initApp();
});
