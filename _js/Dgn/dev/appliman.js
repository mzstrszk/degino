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
// アプリグリッド
// ************************
Dgn.AppliGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;

		var append = function() {
			var AppliRec	= Ext.data.Record.create(stores.config['Appli'].fields);
			that.getStore().add(new AppliRec({
				label:		'名称未設定',
				isPublic:	false
			}));
		};

		var config = {
			id:			'appli_grid',
			ds:			stores.get('Appli'),
		    columns:	[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('label', 		'アプリ名',	180),
				def_grid_column.check('isPublic',	'公開',		40),
//				def_grid_column.date('updated',		'更新日',		60),
				def_grid_column.text('remark',		'備考',		200)
			],
			autoExpandColumn:	'remark',
		    tbar:				[
				{xtype: 'btnappend', id: 'add_appli', handler: append},
				{xtype: 'btnremove', id: 'del_appli', grid: this}
		    ],
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.AppliGrid.superclass.initComponent.call(this);

		// attach events
		this.getSelectionModel().on('selectionchange', function(sm) {
			var selected = sm.getSelected();
			getCmp('del_appli').setDisabled(!selected);
		});
	}
});

// ************************
// チャネルグリッド
// ************************
Dgn.ChannelGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;

		var append = function() {
			var ChannelRec	= Ext.data.Record.create(stores.config['Channel'].fields);
			that.getStore().add(new ChannelRec({
				title:			'名称未設定',
				channeltype:	0,
				appli_id:		that.parent.get('_id')
			}));
		};

		this.channelwin	= new Dgn.ChannelWin();

		var config = {
			id:					'channel_grid',
		    ds:					stores.get('Channel'),
		    columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('title', 		'チャネル名',	140),
				def_grid_column.date('updated',		'更新日',		60)
			],
		    autoExpandColumn:	'title',
		    tbar:				[
				{xtype: 'btnappend', id: 'add_channel', handler: append, disabled: true},
				{xtype: 'btnremove', id: 'del_channel', grid: this}
		    ]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.ChannelGrid.superclass.initComponent.call(this);

		this.getSelectionModel().on('selectionchange', function(sm) {
			var selected = sm.getSelected();
			getCmp('del_channel').setDisabled(!selected);
		});

		this.on('rowdblclick', this.onRowdblclick);
		this.on('parentchange', this.onParentChange);
	},
	onRowdblclick: function(grid, index, evt) {			
//		this.channelwin.show(this.getEl());
		this.channelwin.show();
	
		var rec = this.getSelectionModel().getSelected();
		this.channelwin.setupForm(rec);
	},
	onParentChange: function(rec) {
		this.parent = rec;

		// ストア調整
		if (rec) {
    		this.getStore().load({params: {_PARENT: rec.get('_id')}});
		} else {
			this.getStore().removeAll();
		}

		// ボタン調整
		getCmp('add_channel').setDisabled(!rec);
	}
});

// ************************
// パネルグリッド
// ************************
Dgn.PanelGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;

		this.panelwin	= new Dgn.PanelWin({});

		var help = function(evt, el, pnl, tc) {
			Ext.Msg.show({
				title:		'ヘルプ',
				msg:		'パネルを追加するには、ファイルをドロップしてください。',
				buttons:	Ext.Msg.OK,
				animEl:		el,
				icon:		Ext.Msg.INFO
			});
		};

		var config = {
			id:					'panel_grid',
			title:				'パネル一覧',
			ds:					stores.get('Panel'),
			columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('title', 		'パネル名',	140),
		//		def_grid_column.store('file_id', 	'ファイル',	140,	'File'),
		//		def_grid_column.combo('view_type', 	'表示形式',	80,	'viewType'),
				def_grid_column.date('updated',		'更新日',		60)
			],
			autoExpandColumn:	'title',
			tools:				[{id: 'help', handler: help}],
			tbar:				[
				{xtype: 'btnremove', id: 'del_panel', grid: this}
			]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PanelGrid.superclass.initComponent.call(this);

		// attach events
		this.getSelectionModel().on('selectionchange', function(sm) {
			var selected = sm.getSelected();
			getCmp('del_panel').setDisabled(!selected);
		});

		this.on('rowdblclick', this.onRowdblclick);
		this.on('parentchange', this.onParentChange);
	},
	onRender: function(cmp) {
		var that = this;

        // call parent
		Dgn.PanelGrid.superclass.onRender.apply(this, arguments);

		// drop function
		var add_panel = function(ddSource, e, data) {
			var PanelRec	= Ext.data.Record.create(stores.config['Panel'].fields);
            var channel_id  = that.parent.get('_id');

			Ext.each(ddSource.dragData.selections ,function(it, i, items) {
	            that.getStore().add(new PanelRec({
	                file_id:        it.get('_id'),
	                channel_id:     channel_id,
	                title:          it.get('name') + 'パネル',
	                paneltype:		0,
	                edittype:		0,
	                filtertype:		0
	            }));
			});

			return true;
		};

		// setup drop target
		var fileDDTargetEl	=  this.getView().el.dom.childNodes[0].childNodes[1];
		var fileDDTarget	= new Ext.dd.DropTarget(fileDDTargetEl, {
			ddGroup    : 'fileDD',
			notifyDrop : add_panel
		});
	},
	onRowdblclick: function(grid, index, evt) {
		// show editor window
//		this.panelwin.show(this.getEl());
		this.panelwin.show();

		var rec = this.getSelectionModel().getSelected();
		this.panelwin.setupForm(rec);
	},
	onParentChange: function(rec) {
		this.parent = rec;

		if (rec) {
    		this.getStore().load({params: {_PARENT: rec.get('_id')}});
		} else {
			this.getStore().removeAll();
		}
	}
});

// ************************
// マイファイルグリッド
// ************************
Dgn.MyFileGrid = Ext.extend(Dgn.Grid, {
	initComponent: function() {
		var that = this;

		var config = {
			itemId:				'file_grid1',
			title:				'マイファイル',
			ds:					stores.get('File'),
			columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('name', 		'ファイル名',	140),
				def_grid_column.store('table_id', 	'テーブル',	80,	'Table'),
				def_grid_column.check('isPublic',	'公開',		40)
//				def_grid_column.date('updated',		'更新日',		60)
			],
			autoExpandColumn:	'table_id',
			enableDragDrop:		true,
			ddGroup:			'fileDD'
/*
			frame:				true,
			padding:			5
*/
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.MyFileGrid.superclass.initComponent.call(this);
	}
});

// ************************
// 公開ファイルグリッド
// ************************
Dgn.PubFileGrid = Ext.extend(Dgn.Grid, {
	initComponent: function() {
		var that = this;

		var config = {
			itemId:				'file_grid2',
			title:				'公開ファイル',
			ds:					stores.get('File'),
			columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('name', 		'ファイル名',	140),
				def_grid_column.store('table_id', 	'テーブル',	80,	'Table'),
				def_grid_column.text('owner_name',	'所有者',		80)
//				def_grid_column.date('updated',		'更新日',		60)
			],
			autoExpandColumn:	'table_id',
			enableDragDrop:		true,
			ddGroup:			'fileDD'
/*
			frame:				true,
			padding:			5,		    
			border:				true
*/
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PubFileGrid.superclass.initComponent.call(this);
	}
});

// ************************
// アプリ編集
// ************************

Dgn.AppliWin = Ext.extend(Ext.Window, {
	initComponent: function() {
		this.appli_grid		= new Dgn.AppliGrid({});
		this.channel_grid	= new Dgn.ChannelGrid({});
		this.panel_grid		= new Dgn.PanelGrid({});
		this.file_grid		= new Dgn.MyFileGrid({});
		this.file_grid2		= new Dgn.PubFileGrid({});

		// 依存グリッドの登録
		this.appli_grid.getSelectionModel().on('selectionchange', function(sm) {
			this.channel_grid.fireEvent('parentchange', sm.getSelected());
		}, this);
		this.channel_grid.getSelectionModel().on('selectionchange', function(sm) {
			this.panel_grid.fireEvent('parentchange', sm.getSelected());
		}, this);


		// ファイルエリアの有効/無効
		this.channel_grid.getSelectionModel().on('selectionchange',	function(sm) {
			var selected	= sm.getSelected();
			
			getCmp('file_area').setDisabled(!selected);
		});

		// アプリ編集ウィンドウ
		var config = {
			title:			'アプリ作成',
		    width:			800,
		    height:			540,
		    closeAction:	'hide',
		    plain: 			false,
			layout:			'border',
			items:		[{
				region:			'north',
				title:			'アプリ一覧',
				layout:			'fit',
				collapsible:	true,
				height:			160,
				split:			true,
				items:			[this.appli_grid]
			}, {
				region:			'west',
				title:			'チャネル一覧',
				layout:			'fit',
				collapsible:	true,
				width:			220,
				split:			true,
				items:			[this.channel_grid]
			}, {
				region:			'center',
				layout:			'fit',
				split:			true,
				items:			[this.panel_grid]
			}, {
				region:			'east',
				id:				'file_area',
				xtype:			'tabpanel',
				split:			true,
				disabled:		true,
				width:			320,
				activeItem:		0,
				items:			[this.file_grid, this.file_grid2]
			}]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.AppliWin.superclass.initComponent.call(this);

		// attach events
		getCmp('file_area').on('tabchange', function(panel, tab) {
			var store = stores.get('File');
			switch(tab.getItemId()) {
			case 'file_grid1':
				store.filter('owner_id', Dgn.G_USER._id);
				break;
			case 'file_grid2':
				store.filter('isPublic', true);
				break;
			}
		});
	}
});
