/*
 * Degino Ver.1
 * Copyright (c) 2009 Y.Tokutomi
 * Licensed under GPLv3
 * http://www.gnu.org/licenses/gpl-3.0.html
 *
 * info@degino.com
 */

/*global Ext Dgn */

new Ext.data.ArrayStore({
	storeId:	'StorefieldType',		// 項目の型
	fields:		['_id', 'label'],
	data:		[
		[11, '文字列'],	[12, '文章'],	[13, 'リッチテキスト'],
		[21, '数値'],	[22, '通貨'],	[23, 'シーケンス'],
		[31, '日時'],	[32, '日付'],	[33, '時刻'],
		[41, '真偽値'],
		[51, '単一選択']
	]
});

//*****************
// マイテーブルグリッド
//*****************
Dgn.MyTableGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;

		var append = function() {
			var user = that.initialConfig.app.user;

			var TableRec	= Ext.data.Record.create(stores.config['Table'].fields);
			getStore('Table').add(new TableRec({
				owner_id:	Dgn.G_USER._id,
				owner_name:	Dgn.G_USER.nickname,
				isPublic:	false,
				title:		'名称未設定'
			}));
		};

		var config = {
			id:					'table_grid11',
			itemId:				'my_table',
			title:				'マイテーブル',
			ds:					stores.get('Table'),
		    columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('title', 		'テーブル名',	140),
				def_grid_column.check('isPublic',	'公開',		40),
				def_grid_column.date('updated',		'更新日',		60)
			],
			autoExpandColumn:	'title',
			enableDragDrop:		true,
			ddGroup:			'tableDD',
/*
			frame:				true,
			padding:			5,
*/
		    tbar:				[
				{xtype: 'btnappend', id: 'add_table', handler: append},
				{xtype: 'btnremove', id: 'del_table', grid: this}
		    ]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.MyTableGrid.superclass.initComponent.call(this);

		// attach events
		this.on('render', function(cmp) {
			Dgn.util.addChild(this, getCmp('del_table'));
		});
	}
});

//*****************
// 公開テーブルグリッド
//*****************
Dgn.PubTableGrid = Ext.extend(Dgn.Grid, {
	initComponent: function() {
		var config = {
			id:					'table_grid12',
			itemId:				'pub_table',
			title:				'公開テーブル',
			ds:					stores.get('Table'),
		    columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('title', 		'テーブル名',	140),
				def_grid_column.text('owner_name',	'所有者',		60),
				def_grid_column.date('updated',		'更新日',		60)
			],
			autoExpandColumn:	'title',
			enableDragDrop:		true,
			ddGroup:			'tableDD',
/*
			frame:				true,
			padding:			5,		    
*/
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PubTableGrid.superclass.initComponent.call(this);
	}
});

//******************
// マイエレメントグリッド
//******************
Dgn.MyElementGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;

		var append = function() {
			var ElementRec	= Ext.data.Record.create(stores.config['Element'].fields);
			getStore('Element').add(new ElementRec({
				name:		'名称未設定',
				isRequired:	false,
				f_type:		getStore('fieldType').getAt(0).get('_id'),
				table_id:	that.parent.get('_id')
			}));
		};

		var config = {
		    id:					'element_grid',
		    ds:					stores.get('Element'),
		    columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('name', 		'項目名',		140),
				def_grid_column.combo('f_type',		'型',		60,		'fieldType'),
				def_grid_column.check('isRequired',	'必須',		40),
				def_grid_column.text('option', 		'選択肢',		160)
			],
		    autoExpandColumn:	'name',
/* 		    border:				true, */
		    tbar:				[
				{xtype: 'btnappend', id: 'add_element', handler: append, disabled: true},
				{xtype: 'btnremove', id: 'del_element', grid: this}
		    ],
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.MyElementGrid.superclass.initComponent.call(this);

		// attach events
	},
	onRender: function(cmp) {
        // call parent
		Dgn.MyTableGrid.superclass.onRender.apply(this, arguments);

		// attach events
		Dgn.util.addChild(this, getCmp('del_element'));
	},
	onParentChange: function(rec) {
		Dgn.MyTableGrid.superclass.onParentChange.apply(this, arguments);

		// ボタン調整
		getCmp('add_element').setDisabled(!rec);
	}
});

//******************
// 公開エレメントグリッド
//******************
Dgn.PubElementGrid = Ext.extend(Dgn.Grid, {
	initComponent: function() {
		var config = {
		    ds:					stores.get('Element2'),
		    columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('name', 		'項目名',		140),
				def_grid_column.combo('f_type',		'型',		60,		'fieldType'),
				def_grid_column.check('isRequired',	'必須',		40),
				def_grid_column.text('option', 		'選択肢',		160)
			],
		    autoExpandColumn:	'name'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PubElementGrid.superclass.initComponent.call(this);

		// attach events
	}
});

//******************
// ファイルグリッド
//******************
Dgn.FileGrid = Ext.extend(Dgn.EditorGrid, {
	initComponent: function() {
		var that = this;
		var config = {
			id:					'file_grid',
			ds:					stores.get('File'),
			columns:			[
				new Ext.grid.RowNumberer(),
				def_grid_column.text('name', 		'ファイル名',	180),
				def_grid_column.store('table_id', 	'テーブル',	100,	'Table'),
				def_grid_column.check('isPublic',	'公開',		40),
				def_grid_column.date('updated',		'更新日',		80)
			],
			tbar:				[
				{xtype: 'btnremove', id: 'del_file', grid: this}
			]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.FileGrid.superclass.initComponent.call(this);
	},
	onRender: function(cmp) {
		var that = this;

        // call parent
		Dgn.FileGrid.superclass.onRender.apply(this, arguments);

		// drop function
		var add_file = function(ddSource, e, data) {
			var FileRec	= Ext.data.Record.create(stores.config['File'].fields);

            // Loop through the selections
            Ext.each(ddSource.dragData.selections ,function(it, i, items) {
                that.getStore().add(new FileRec({
                    table_id:	it.get('_id'),
                    name:		it.get('title') + 'ファイル',
                    isPublic:	false
                }));
            });

			return(true);
		};

		// setup drop target
		var tableDDTargetEl	=  this.getView().el.dom.childNodes[0].childNodes[1];
		var tableDDTarget	= new Ext.dd.DropTarget(tableDDTargetEl, {
			ddGroup    : 'tableDD',
			notifyDrop : add_file
		});

		Dgn.util.addChild(this, getCmp('del_file'));
	},
});

Dgn.FileWin = Ext.extend(Ext.Window, {
	initComponent: function() {
		this.file_grid		= new Dgn.FileGrid();
		this.table_grid		= new Dgn.MyTableGrid({app: this.initialConfig.app});
		this.table_grid2	= new Dgn.PubTableGrid();
		this.element_grid	= new Dgn.MyElementGrid();
		this.element_grid2	= new Dgn.PubElementGrid();

		// 依存グリッドの登録
		Dgn.util.addChild(this.table_grid, this.element_grid);
		Dgn.util.addChild(this.table_grid2, this.element_grid2);

		var config = {
			title:			'ファイル追加',
			layout:			'border',
		    width:			800,
		    height:			480,
		    closeAction:	'hide',
		    items:			[{
		    	region:			'west',
		    	id:				'file_area2',
		    	layout:			'fit',
		    	title:			'ファイル一覧',
		    	width:			320,
		    	split:			true,
		    	items:			[this.file_grid],
				tools:			[{
					id:	'help',
					handler:	function(evt, el, pnl, tc) {
						Ext.Msg.show({
							title:		'ヘルプ',
							msg:		'ファイルを追加するには、テーブルをドロップしてください。',
							buttons:	Ext.Msg.OK,
							animEl:		el,
							icon:		Ext.Msg.INFO
						});
					}
				}],
				listeners:	{
					collapse: function(pnl) {
						getCmp('element_area').expand();
					},
					expand: function(pnl) {
						getCmp('element_area').collapse();
					}
				}
		    }, {
		    	region:			'center',
		    	id:				'table_area',
		    	xtype:			'tabpanel',
		    	activeItem:		0,
		    	items:			[this.table_grid, this.table_grid2]
		    }, {
		    	region:			'east',
		    	id:				'element_area',
		    	layout:			'card',
		    	title:			'項目一覧',
		    	split:			true,
		    	collapsed:		true,
		    	activeItem:		0,
		    	width:			480,
		    	items:			[this.element_grid, this.element_grid2],
				listeners:	{
					render:	function(pnl) {
						var func = function(pnl, tab) {
							switch(tab.getId()) {
							case 'table_grid11':
								getCmp('element_area').getLayout().setActiveItem(0);
								break;
							case 'table_grid12':
								getCmp('element_area').getLayout().setActiveItem(1);
								break;
							}
						};
						getCmp('table_area').on('tabchange', func);
					},
					collapse: function(pnl) {
						getCmp('file_area2').expand();
					},
					expand: function(pnl) {
						getCmp('file_area2').collapse();
					}
				}
		    }],
		    tbar:	[{
		    	itemId:			'file_mode',
		    	text:			'ファイルモード',
		    	enableToggle:	true,
		    	pressed:		true,
		    	handler:		function(btn, evt) {
		    		btn.toggle(true);
		    		btn.ownerCt.get('table_mode').toggle(false);
		    		getCmp('element_area').collapse();
		    	}
		    }, {
		    	itemId:			'table_mode',
		    	text:			'テーブルモード',
		    	enableToggle:	true,
		    	handler:		function(btn, evt) {
		    		btn.toggle(true);
		    		btn.ownerCt.get('file_mode').toggle(false);
		    		getCmp('file_area2').collapse();
		    	}
		    }]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.FileWin.superclass.initComponent.call(this);

		// attach events

		var app = this.initialConfig.app;
		getCmp('table_area').on('tabchange', function(panel, tab) {
			var store = stores.get('Table');
			switch(tab.getItemId()) {
			case 'my_table':
				store.filter('owner_id', Dgn.G_USER._id);
				break;
			case 'pub_table':
				store.filter('isPublic', true);
				break;
			}
		});
	}
});
