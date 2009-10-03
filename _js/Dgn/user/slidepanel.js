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
// スライドパネル
// *************************

Dgn.SlidePart = Ext.extend(Ext.Panel, {
	initComponent: function() {
		var cols = this.initialConfig.columns;
		cols = this.complement(cols);

		// テンプレート作成
		var tpl_text = ['<table style="padding:5mm;" width="100%">'];
		Ext.each(cols, function(it, i, items) {
			tpl_text.push(
				'<tr style="vertical-align: top;">' +
				'<th nowrap style="padding:3mm; background-color:silver;" width="15%">' + it.header + '</th>' +
				'<td style="padding:3mm;">{' + it.dataIndex + '}</td>' +
				'</tr>'
			);
		});
		tpl_text.push('</table>');
		var tpl = new Ext.XTemplate(tpl_text.join('\n'));

		var config = {
			tpl:		tpl,
			columns:	cols
//			store:		Ext.StoreMgr.get(this.initialConfig.storeId)
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.SlidePart.superclass.initComponent.call(this);

		// attach events
		this.on('parentrowselect', this.onParentRowSelect);
	},
	onParentRowSelect: function(rec) {
		var that = this;

		var func	= function() {
			that.tpl.overwrite(that.body, rec.data);
		};
		anim(that.getEl(), func);
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
Ext.reg('slidepart', Dgn.SlidePart);

// *************************
// スライドパネル
// *************************

Dgn.SlidePanel = Ext.extend(Ext.Panel, {
	layout:			'border',
	initComponent: function() {
		var that	= this;

		var store	= Ext.StoreMgr.get(this.initialConfig.storeId);

		var config = {
			items:			[{
				region:			'west',
				xtype:			'usergrid',
				itemId:			'grid',
				title:			'一覧',
				store:			store,
				columns:		this.initialConfig.columns,
				width:			'30%',
				collapsible:	true,
				split:			true
			}, {
				region:			'center',
				xtype:			'slidepart',
				itemId:			'slide',
				store:			store,
				columns:		this.initialConfig.columns
			}],
		    bbar: 	['->',
		    {
		    	iconCls:	'x-tbar-page-first',
		    	handler:	function(btn, evt) {that.get('grid').getSelectionModel().selectFirstRow();}
		    }, {
				iconCls:	'x-tbar-page-prev',
		    	handler:	function(btn, evt) {that.get('grid').getSelectionModel().selectPrevious();}
		    }, {
				iconCls:	'x-tbar-page-next',
		    	handler:	function(btn, evt) {that.get('grid').getSelectionModel().selectNext();}
		    }, {
				iconCls:	'x-tbar-page-last',
		    	handler:	function(btn, evt) {that.get('grid').getSelectionModel().selectLastRow();}
		    }]
		};
	
        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.SlidePanel.superclass.initComponent.call(this);

		// attach events
		this.on('render', function(cmp) {
			Dgn.util.addChild(this.get('grid'), this.get('slide'));
		});
	}
});
//Ext.reg('slidepanel', Dgn.SlidePanel);
Ext.reg('slidepanel', Dgn.usergrid);
