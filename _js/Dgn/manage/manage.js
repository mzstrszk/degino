// Charset:utf-8 Tab:4
/*
 * Degino Ver.1 (Ryoma)
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

// アカウント管理
Dgn.accountman = {
	init: function() {
		var that = this;

		this.store = new Ext.data.JsonStore({
			url:		'/DevAjax',
			root:		'recs',
			autoLoad:	true,
			baseParams:	{_MSG: 'SELECT', _MODEL: 'Account'},
			fields:		['nickname', 'basehash', 'authkey', 'mail', 'license', 'registered', 'isAdmin', 'lastlogined', 'created']
		});

		this.grid = new Ext.grid.GridPanel({
		    title:				'アカウント管理',
			ds:					this.store,
		    columns:			[
				new Ext.grid.RowNumberer({width:32}),
				{header:'通称',			dataIndex:'nickname',		sotable: true},
				{header:'ハッシュ',		dataIndex:'basehash', 		sotable: true},
				{header:'認証キー',		dataIndex:'authkey', 		sotable: true},
				{header:'メールアドレス',	dataIndex:'mail',			sotable: true},
				{header:'ライセンス',		dataIndex:'license',		sotable: true},
				{header:'管理権限',		dataIndex:'isAdmin',		sotable: true},
				{header:'作成日',			dataIndex:'created',		sotable: true},
				{header:'登録日',			dataIndex:'registered',		sotable: true},
				{header:'最終ログイン',	dataIndex:'lastlogined',	sotable: true}   
			],
		    sm:					new Ext.grid.RowSelectionModel({singleSelect: true}),
		//	autoExpandColumn:	'title',
		    border:				true,
		    viewConfig:			{forceFit: true},
			stateful:			true,
			stateEvents:		['columnresize', 'columnmove', 'columnvisible', 'columnsort']
		});
	}
};

Dgn.recman = {
	init: function() {
		var that = this;

		// ファイルストア
		this.file_store = new Ext.data.JsonStore({
			url:		'/DevAjax',
			root:		'recs',
			autoLoad:	true,
			baseParams:	{_MSG: 'SELECT', _MODEL: 'File3'},
			fields:		['_id', 'table_id', 'name']
		});
		
		// ファイルグリッド
		this.file_sm = new Ext.grid.RowSelectionModel({
			singleSelect:	true,
			listeners:		{
				rowselect:	 function(sm, index, rec) {
					that.record_store.load({params: {_PARENT: rec.get('_id')}});
				}
			}
		});
		this.file_grid = {
		    xtype:				'grid',
		    autoScroll:			true,
			ds:					this.file_store,
		    columns:			[
				new Ext.grid.RowNumberer({width:32}),
				{header:'テーブル名',	dataIndex:'table_id',	sotable: true},
				{header:'ファイル名',	dataIndex:'name', 		sotable: true}
			],
		    sm:					this.file_sm,
		    border:				true,
			stateful:			true,
			stateEvents:		['columnresize', 'columnmove', 'columnvisible', 'columnsort']
		};

		// レコードストア
		this.record_store = new Ext.data.JsonStore({
			url:		'/UserAjax',
			root:		'recs',
			baseParams:	{_MSG: '_LIST', _MODEL: 'RowRecord'},
			fields:		['owner_id', 'owner_name', 'json', 'created', 'updated']
		});
		
		// レコードグリッド
		this.record_grid = {
		    xtype:				'grid',
		    autoScroll:			true,
			ds:					this.record_store,
		    columns:			[
				new Ext.grid.RowNumberer({width:32}),
				{			header:'所有者',		dataIndex:'owner_name',	sotable: true},
				{id:'json',	header:'JSON',		dataIndex:'json', 		sotable: true,	renderer: Ext.util.Format.htmlEncode},
				{			header:'作成日',		dataIndex:'created',	sotable: true},
				{			header:'更新日',		dataIndex:'updated',	sotable: true}
			], 
		    sm:					new Ext.grid.RowSelectionModel({singleSelect: true}),
			autoExpandColumn:	'json',
		    border:				true,
			stateful:			true,
			stateEvents:		['columnresize', 'columnmove', 'columnvisible', 'columnsort']
		};
		
		this.panel = new Ext.Panel({
			title:			'レコード管理',
			layout:			'hbox',
			layoutConfig:	{
				align:	'stretch'
			},
			defaults:	{
				layout:	'fit'
			},
			items:		[{
				flex:	1,
				items: [this.file_grid]
			}, {
				flex:	4,
				items: [this.record_grid]
			}]
		});
	}
};

Dgn.ManageApp = Ext.extend(Dgn.AbstractApp, {
	constructor: function(cfg) {
		Dgn.ManageApp.superclass.constructor.apply(this, arguments);	

		Dgn.accountman.init();
		Dgn.recman.init();
	
		var temp = new Ext.Viewport({
			layout:	'border',
			items:	[{
				region:	'north',
				height:	50,
				html:	'<h1 align="right">Ryoma プロトタイプ</h1><p align="right">[ <a href="/Dev">設計モード</a> | <a href="/User">ユーザーモード</a> ]</p>'
			}, {
				region:	'center',
				layout:	'fit',
				items:	{
					xtype:		'tabpanel',
					activeItem:	0,
					items:		[Dgn.accountman.grid, Dgn.recman.panel]
				}
			}, {
				region:	'south',
				height:	30,
				html:	'<p align="center" font="smaller">Copyright &copy; 2009 Degino All rights reserved.</p>'
			}
		]});
	
	
		log('Hello');
	}
});

Ext.onReady(function(){
	var app = Dgn.ManageApp();
});
