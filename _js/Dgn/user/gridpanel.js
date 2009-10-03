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

// *************************
// Degino User グリッド
// *************************
Dgn.UserGrid = Ext.extend(Dgn.Grid, {
	stripeRows:		true,
	initComponent:	function() {
		var cols = this.initialConfig.columns;
		cols = this.complement(cols);

		var config = {
			columns:	[new Ext.grid.RowNumberer()].concat(cols),
			store:		Ext.StoreMgr.get(this.initialConfig.storeId)
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.UserGrid.superclass.initComponent.call(this);

		// attach events
	},
	complement: function(cols) {
		// カラム仕様の補完
		Ext.each(cols, function(it, i, items) {
			// renderer
			it.renderer && (it.renderer = this.renderers[it.renderer]);
		}, this);

		return cols;
	},
	renderers: {
		bool:			format.bool,
		text:			Ext.util.Format.htmlEncode,
		date:			format.date,
		time:			format.time,
		datetime:		format.datetime
	}
});
Ext.reg('usergrid', Dgn.UserGrid);

// *************************
// Degino User Editor グリッド
// *************************
Dgn.UserEditorGrid = Ext.extend(Dgn.EditorGrid, {
	stripeRows:		true,
	initComponent:	function() {
		var cols = this.initialConfig.columns;
		cols = this.complement(cols);
		
		var store = Ext.StoreMgr.get(this.initialConfig.storeId);

		var append = function() {
			store.fireEvent('reqappend');
		};

		var config = {
			columns:	[new Ext.grid.RowNumberer()].concat(cols),
			store:		store,
			tbar:		[
				{xtype: 'btnappend', id:'add_record', handler: append},
				{xtype: 'btnremove', id:'del_record', grid: this}
			]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.UserEditorGrid.superclass.initComponent.call(this);

		// attach events
		this.on('render', function(cmp) {
			Dgn.util.addChild(this, getCmp('del_record'));
		});
	},
	complement: function(cols) {
		// カラム仕様の補完
		Ext.each(cols, function(it, i, items) {
			// renderer
			it.renderer && (it.renderer = this.renderers[it.renderer]);

			// editor
			if (it.editor) {
				if (it.editor.xtype == 'combo') {
					// コンボボック用ストア生成
					it.editor.store = that.substore(it.hiddenName, it.editor.store);
					it.editor = new Ext.form.ComboBox(it.editor);
				} else {
					var xtype = it.editor.xtype;
					delete it.editor.xtype;
					it.editor = new this.editors[xtype](it.editor);
				}
			}
		}, this);

		return cols;
	},
	renderers: {
		bool:			format.bool,
		text:			Ext.util.Format.htmlEncode,
		date:			format.date,
		time:			format.time,
		datetime:		format.datetime
	},
	editors: {
		textfield:		Ext.form.TextField,
		textarea:		Ext.form.TextField,
		numberfield:	Ext.form.NumberField,
		datefield:		Ext.form.DateField,
		timefield:		Ext.form.TimeField,
		checkbox:		Ext.form.Checkbox,
		combo:			Ext.form.ComboBox
	},
	substore: function(id, str) {
		var data = [];
		if (str) {
			Ext.each(str.split(','), function(it, i, items){
				data.push(it.split(':'));
			});
		}

		var store = new Ext.data.ArrayStore({
			id:		'Store' + id,
			fields:	['code', 'label'],
			data:	data
		});

		return store;
	}
});
Ext.reg('usereditorgrid', Dgn.UserEditorGrid);


Dgn.UserGridForm = Ext.extend(Ext.Panel, {
	initComponent:	function() {
		var that = this;
	
		panelgen.complement1(spec);
	
		// グリッド部分定義
		var grid_config = {
			columnWidth:	0.4,
			layout:			'fit',
			height:			280,
			items:			{ // グリッド表示部
				id:			spec._id,
				xtype:		'grid',
				stripeRows:	true,
				autoScroll:	true,
				store: 		storeman.get(spec.file_id, spec['elements']),
				columns:	[new Ext.grid.RowNumberer()].concat(spec['columns']),
				sm:			new Ext.grid.RowSelectionModel({
					singleSelect:	true,
					listeners:		{
						rowselect: function(sm, row, rec) {
							Ext.getCmp(spec._id + 'form').getForm().loadRecord(rec);
						}
					}
				}),
				border:		true,
				listeners:	{
					render:	function(g) {
				 		g.getSelectionModel().selectFirstRow();
				 	},
				 	delay:	20 // Allow rows to be rendered.
				 }
			},
			tbar:		[
				this.get_appendbtn(spec['elements'], spec.file_id),
				this.delConf(spec._id)
			]
		};
	
		// コンボボック用ストア生成
		Ext.each(spec['fields'], function(it, i, items) {
			if (!('store' in it)) return;
			
			it.store = that.substore(it.hiddenName, it.store);
		}, this);
	
		var hdls = {
			save: function(btn, evt) {
				var rec = getSm(spec._id).getSelected();
				getCmp(spec._id + 'form').getForm().updateRecord(rec);
			},
			prev: function(btn, evt) {
				hdls.save(btn, evt);
				var sm = getSm(spec._id);
				if (sm.hasPrevious()) {
					sm.selectPrevious();
				}
			},
			next: function(btn, evt) {
				hdls.save(btn, evt);
				var sm = getSm(spec._id);
				if (sm.hasNext()) {
					sm.selectNext();
				}
			}
		};
	
		// フォーム部分定義
		var fieldset_config = {
			columnWidth:	0.6,
			xtype:			'fieldset',
			labelWidth:		80,
			defaults:		{width: 300},	// Default config options for child items
			defaultType:	'textfield',
			bodyStyle:		Ext.isIE ? 'padding:0 0 5px 15px;' : 'padding:10px 15px;',
			border:			false,
			style: {
				'margin-left':	'10px', // when you add custom margin in IE 6...
				'margin-right':	Ext.isIE6 ? (Ext.isStrict ? '-10px' : '-13px') : '0'  // you have to adjust for it somewhere else
			},
			items:			spec['fields'],
			buttons:		[
				{text: '保存する', type: 'submit', handler:hdls.save},
				{text: '保存 & 前へ', handler: hdls.prev},
				{text: '保存 & 次へ', handler: hdls.next}
			]
		};
	
		var config = {
			id:				spec._id + 'form',
			title:			spec.title,
			frame:			true,
			labelAlign:		'left',
			collapsible:	true,
			height:			300,
			layout:			'column',	// Specifies that the items will now be arranged in columns
			autoScroll:		true,
			items:			[grid_config, fieldset_config]
		};
	
	    // apply config
	    Ext.apply(this, config);
	    Ext.apply(this.initialConfig, config);
	
	    // call parent
		Dgn.UserGridForm.superclass.initComponent.call(this);
	
		// attach events
		this.on('render', function(cmp) {
			Dgn.util.addChild(this, getCmp('del_record'));
		});
	}
});

// ************************
// 月次フィルターグリッド
// ************************

Dgn.MonthFilter = Ext.extend(Dgn.Grid, {
	initComponent: function() {

		this.app = this.initialConfig.app;

		// 月フィルター用ストア
		var store = new Ext.data.ArrayStore({
			fields:	['code', 'value'],
			data:	[
				[0, 'すべて'], [1, '1 月'], [2, '2 月'], [3, '3 月'], [4, '4 月'], [5, '5 月'], [6, '6 月'],
				[7, '7 月'], [8, '8 月'], [9, '9 月'], [10, '10 月'], [11, '11 月'], [12, '12 月']
			]
		});

		var config = {
			store:				store,
			columns:			[{id:'value', header:'月', dataIndex:'value'}],
			autoExpandColumn:	'value'
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.MonthFilter.superclass.initComponent.call(this);

		// attache events
		this.relayEvents(this.getSelectionModel(), ['rowselect']);
	},
});
Ext.reg('monthfilter', Dgn.MonthFilter);
Dgn.MonthFilter.GetFieldPlugin = function(elements) {
   // 日付、項目探索
	var f_name	= null;
	var pi		= null;

	Ext.each(elements, function(it, i, items) {
		if (it['type'] == 'date') {
			f_name = Dgn.util.nval(f_name, it.name);
		}
	});
	if (f_name) {
		filterPI = new Dgn.MonthFilterPI();
		filterPI.setFilter(f_name);
	}
	
	return pi;
};

Dgn.MonthFilterPI = Ext.extend(Ext.util.Observable, {
    init: function(grid) {
    	this.grid = grid;
		grid.on('filter', this.onFilter, this);
    },
    onFilter: function(frec) {
		var store = this.grid.getStore();

		if (frec.get('code')) {
			store.filterBy(function(rec, id) {
			    return rec.get(this.filter).getMonth() == frec.get('code')-1;
			}, this);
		} else {
			store.clearFilter();
		}
    },
    setFilter: function(f_name) {
    	this.filter = f_name;
    }
});
