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
// アプリトップパネル
// ************************

Dgn.PnlAnchor = Ext.extend(Ext.Panel, {
	layout:		'anchor',
	autoScroll:	true,
	defaults:	{height: 300}
});

Dgn.PnlFit = Ext.extend(Ext.Panel, {
	layout:		'fit'
});

Dgn.PnlCard = Ext.extend(Ext.Panel, {
	layout:		'card',
	activeItem:	0,
	initComponent: function() {
		var prev = new Ext.Button({iconCls: 'x-tbar-page-prev'});
		var next = new Ext.Button({iconCls: 'x-tbar-page-next'});

		var config = {
	        bbar: ['->', prev, next]
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PnlCard.superclass.initComponent.call(this);

		// attache events
		prev.on('click', function(btn, evt) {
			var layout = this.getLayout();
    		var prev = layout.activeItem.previousSibling();
    		if (prev) {
				layout.setActiveItem(prev);
    		}
		}, this);

		next.on('click', function(btn, evt) {
			var layout = this.getLayout();
    		var next = layout.activeItem.nextSibling();
    		if (next) {
				layout.setActiveItem(next);
    		}
		}, this);
	}
});

Dgn.PnlTab = Ext.extend(Ext.TabPanel, {
	autoScroll:	true,
	activeTab:	0
});

Dgn.PnlTable = Ext.extend(Ext.Panel, {
	layout:			'table',
	autoScroll:		true,
	defaults:		{
		height:	300
	},
	layoutConfig:	{columns: 2}
});

Dgn.PnlColumn2 = Ext.extend(Ext.Panel, {
	layout:			'column',
	autoScroll:		true,
	defaults:		{
		height:			300,
		columnWidth:	0.5
	}
});

Ext.reg('pnlanchor',	Dgn.PnlAnchor);
Ext.reg('pnlfit',		Dgn.PnlFit);
Ext.reg('pnlcard',		Dgn.PnlCard);
Ext.reg('pnltab', 		Dgn.PnlTab);
Ext.reg('pnltable',		Dgn.PnlTable);
Ext.reg('pnlcolumn2',	Dgn.PnlColumn2);


// パネル

Dgn.LChart = Ext.extend(Ext.chart.LineChart, {
	initComponent:	function() {
		var config = {
			store:		Ext.StoreMgr.get(this.initialConfig.storeId)
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.LChart.superclass.initComponent.call(this);

		// attach events
	}
});

Dgn.CChart = Ext.extend(Ext.chart.ColumnChart, {
	initComponent:	function() {
		var config = {
			store:		Ext.StoreMgr.get(this.initialConfig.storeId)
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.CChart.superclass.initComponent.call(this);

		// attach events
	}
});

Dgn.PChart = Ext.extend(Ext.chart.PieChart, {
	extraStyle: {
		legend: {
			display:	'bottom'
		}
	},
	initComponent:	function() {
		var config = {
			store:		Ext.StoreMgr.get(this.initialConfig.storeId)
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.PChart.superclass.initComponent.call(this);

		// attach events
	}
});

Ext.reg('uline',		Dgn.LChart);			// 折線グラフ
Ext.reg('ucolumn',		Dgn.CChart);			// 棒グラフ
Ext.reg('upie',			Dgn.PChart);			// 円グラフ
Ext.reg('uslide',		Dgn.SlidePanel);		// スライドパネル
Ext.reg('ugrid',		Dgn.UserGrid);			// グリッド
Ext.reg('uegrid',		Dgn.UserEditorGrid);	// 編集グリッド
Ext.reg('ugridform',	Dgn.UserGrid);			// 横フォーム


// ************************
// ワークエリア定義
// ************************

Dgn.WorkArea = Ext.extend(Ext.Panel, {
	layout:		'card',
	initComponent: function() {
        // call parent
		Dgn.WorkArea.superclass.initComponent.call(this);

		// attache events
		this.on('parentchange', this.onParentChange, this);
	},
	onParentChange: function(rec) {
		if (rec) {
			var channel_id	= rec.get('_id');
			
			var cmp = getCmp('WORK' + channel_id);
	
			if (cmp) {
				this.setActiveItem('WORK' + channel_id);
			} else {
				this.build(channel_id);
			}
		}
	},
	setActiveItem: function(cmp_id) {
		this.getLayout().setActiveItem(cmp_id);
	},
	build: function(channel_id) {
		var that = this;

		// パネル構築
		Ext.Ajax.request({
			url:		'/UserPanel',
			params:		{_id: channel_id},
			success:	function(res, opt) {
				log(res.responseText);
		 		var config	= Ext.util.JSON.decode(res.responseText);

				stores = config.stores;
				panels = config.panels;

				// ストア構築
		 		Ext.each(stores, function(it, i, items) {
		 			storeman.get2(it);
		 		});

				// ワークエリアのセットアップ
				that.add(panels);
	
				that.setActiveItem(panels.id);
			}
		});
	},
});
Ext.reg('workarea', Dgn.WorkArea);
