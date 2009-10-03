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
// 初期設定
// ************************

Ext.ns('Dgn');

// ************************
// 抽象アプリケーションクラス
// ************************
Dgn.AbstractApp = function() {
	Dgn.AbstractApp.superclass.constructor.apply(this, arguments);	

	// 各種アプリケーション設定
	var cp = new Ext.state.CookieProvider();
	Ext.state.Manager.setProvider(cp);
	Ext.form.Field.prototype.msgTarget = 'side';
	Ext.QuickTips.init();

	Ext.BLANK_IMAGE_URL = '_js/ext-3.0.0/resources/images/default/s.gif';
/*
	Ext.apply(Ext, {
	    BLANK_IMAGE_URL : (function() {
	        if ((Ext.isIE8) || Ext.isGecko) {
	            return "data:image/gif;base64,R0lGODlhAQABAID/AMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==";
	        } else {
	            return "http:/"+"/extjs.cachefly.net/ext-" + Ext.version + "/resources/images/default/s.gif";
	        }
	    })()
	});
*/
};
Ext.extend(Dgn.AbstractApp, Ext.util.Observable, {
	initApp: function() {
		var that = this;

		// ユーザ情報取得
		Dgn.G_USER = {};
		
		Ext.Ajax.request({
			method:		'POST',
			url:		'/DevAjax',
			params:		{_MSG: 'USER'},
			success:	function(res, opt) {
		 		var ret	= Ext.util.JSON.decode(res.responseText);
				Dgn.G_USER = ret.recs;
			},
			failure:	failure_dialogue
		});
	}
});

// *************************
// Degino GridPanel 基底クラス
// *************************
Dgn.Grid = Ext.extend(Ext.grid.GridPanel, {
	initComponent: function() {
		var config = {
			sm:				new Ext.grid.RowSelectionModel({singleSelect: true}),
			viewConfig:		{forceFit: true},
			autoScroll:		true,
			stateful:		true,
			stateEvents:	['columnresize', 'columnmove', 'columnvisible', 'columnsort']
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Grid.superclass.initComponent.call(this);

		// attach events
		this.on('render', this.selectFirst, this, {delay: 20, single: true});
		this.on('parentchange', this.onParentChange, this);

		this.getView().on('refresh', this.selectFirst, this, {delay: 100});
	},
	selectFirst: function() {
		this.getSelectionModel().selectFirstRow();
	},
	onParentChange: function(rec) {
		this.parent = rec;

		if (rec) {
    		this.store.load({params: {_PARENT: rec.get('_id')}});
		} else {
			this.store.removeAll();
		}
	}
});

// *******************************
// Degino EditorGridPanel 基底クラス
// *******************************
Dgn.EditorGrid = Ext.extend(Ext.grid.EditorGridPanel, {
	initComponent: function() {
		var config = {
			sm:				new Ext.grid.RowSelectionModel({singleSelect: true}),
			viewConfig:		{forceFit: true},
			autoScroll:		true,
		    clicksToEdit:	'auto',
			stateful:		true,
			stateEvents:	['columnresize', 'columnmove', 'columnvisible', 'columnsort']
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.EditorGrid.superclass.initComponent.call(this);

		// attach events		
		this.on('render', this.selectFirst, this, {delay: 20, single: true});
		this.on('parentchange', this.onParentChange, this);

		this.getView().on('refresh', this.selectFirst, this, {delay: 20});
	},
	selectFirst: function() {
		this.getSelectionModel().selectFirstRow();
		return true;
	},
	onParentChange: function(rec) {
		this.parent = rec;

		if (rec) {
    		this.store.load({params: {_PARENT: rec.get('_id')}});
		} else {
			this.store.removeAll();
		}
	}
});

// ************************
// 設計モード用 JsonStore
// ************************

Dgn.DevStore = function(cfg) {
	Ext.applyIf(cfg, {
		url:		'/DevAjax',
		root:		'recs',
	});
    // call parent
	Dgn.DevStore.superclass.constructor.apply(this, arguments);
};
Ext.extend(Dgn.DevStore, Ext.data.JsonStore, {
});

// *******************************
// Dgn ボタン基底クラス
// *******************************
Dgn.Button = Ext.extend(Ext.Button, {
	initComponent: function() {
		var config = {
		};
        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.Button.superclass.initComponent.call(this);

		// attach events		
	}
});

// "ログアウト" ボタン
Dgn.BtnLogout = Ext.extend(Dgn.Button, {
	initComponent: function() {
		var config = {
			text:		'ログアウト',
			handler:	logout
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.BtnLogout.superclass.initComponent.call(this);

		// attach events		
	}
});
Ext.reg('btnlogout', Dgn.BtnLogout);

// "戻る" ボタン
Dgn.BtnReturn = Ext.extend(Dgn.Button, {
	initComponent: function() {
		var config = {
			text:		'戻る',
			iconCls:	'btn_return',
			handler:	function(btn, evt) {
				location.replace('/Auth');
			}
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.BtnReturn.superclass.initComponent.call(this);

		// attach events		
	}
});
Ext.reg('btnreturn', Dgn.BtnReturn);

// "追加" ボタン
Dgn.BtnAppend = Ext.extend(Dgn.Button, {
	text:		'追加',
	iconCls:	'btn_append',
	initComponent: function() {
        // call parent
		Dgn.BtnAppend.superclass.initComponent.call(this);

		// attach events
		this.on('parentchange', this.onParentChange);
	},
	onParentChange: function(rec) {
		this.setDisabled(!rec);
	}
});
Ext.reg('btnappend', Dgn.BtnAppend);

// "削除" ボタン
Dgn.BtnRemove = Ext.extend(Dgn.Button, {
	text:		'削除',
	iconCls:	'btn_remove',
	initComponent: function() {
		var grid	= this.initialConfig.grid;

		var removeAlert = function(btn, evt) {
			var sm		= grid.getSelectionModel();
			var store	= grid.getStore();
			var rec		= sm.getSelected();
			var fn		= function(buttonId, text) {
				if (buttonId == 'ok') {
					store.remove(rec);
				}
			};

			Ext.Msg.show({
				title:		'注意',
				msg:		String.format('"{0}" を削除します。よろしいですか?', rec.get('title')),
				width:	 	300,
				buttons:	Ext.MessageBox.OKCANCEL,
				animEl:		btn.getEl(),
				icon:		Ext.MessageBox.WARNING,
				fn:			fn
			});
		};

		var config = {
			handler:	removeAlert,
	    	disabled:	true
		};

        // apply config
        Ext.apply(this, config);
        Ext.apply(this.initialConfig, config);

        // call parent
		Dgn.BtnRemove.superclass.initComponent.call(this);

		// attach events
		this.on('parentchange', this.onParentChange);
	},
	onParentChange: function(rec) {
		this.setDisabled(!rec);
	}
});
Ext.reg('btnremove', Dgn.BtnRemove);

// ************************
// エイリアス
// ************************

var getStore	= function(key){ return Ext.StoreMgr.get("Store" + key);		};
var getForm		= function(key){ return Ext.getCmp(key).getForm();				};
var getSm		= function(key){ return Ext.getCmp(key).getSelectionModel();	};
var getCmp		= function(key){ return Ext.getCmp(key);						};

// ************************
// ユーティリティ
// ************************

Dgn.util = {
	// null 値の時の置き換え表示
	nval: function(src, dst) {
		return src ? src : dst;
	},
	// mail address のバリデーション
	vld_mail: function(fvalue) {
	   var msg		= 'メールをアドレスを "user@domail.com" の形式で入力してください。';
	   var email	= /^([a-zA-Z0-9+])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/;

	   return email.test(fvalue) ? true : msg;
	},
	addChild: function(grid, child) {
		var sm = grid.getSelectionModel();
		sm.on('rowselect', function(sm, index, rec) {
			child.fireEvent('parentrowselect', rec);
		});

		sm.on('selectionchange', function(sm) {
			child.fireEvent('parentchange', sm.getSelected());
		});		
	}
};

// 成功メッセージ (AJAX)
function success_dialogue(res, opt) {
	Ext.Msg.alert("AJAX:", "Success!");
}

// 失敗メッセージ (AJAX)
function failure_dialogue(res, opt) {
	Ext.Msg.alert("AJAX:", "Failure!");
}

// ログアウト
function logout(btn, evt) {
	var params	= {_MSG:'_LOGOUT'};
	var success = function(res, opt) {
		location.replace('/Auth');
	};

	Ext.Ajax.request({
		method:		'POST',
		url:		'/Auth',
		params:		params,
		success:	success,
		failure:	failure_dialogue
	});
}

// ************************
// フォーマッター
// ************************

var format =  {
	bool:	function(val) {
		return (val) ? '&radic;' : '';
	},
	date:		Ext.util.Format.dateRenderer('Y.n.j'),
	time:		Ext.util.Format.dateRenderer('H:i'),
	datetime:	Ext.util.Format.dateRenderer('Y.n.j H:i')
};

// ************************
// グリッドカラム定義
// ************************

var def_grid_column = {
	text:	function(id, label, width) {
		return {
			id:			id,
			dataIndex:	id,
			header:		label,
			sortable:	true,
			width:		width,
			renderer:	Ext.util.Format.htmlEncode,
			editor:		new Ext.form.TextField()
		};
	},
	store:	function(id, label, width, storeId) {
		var renderer	= function(val) {
			var store	= getStore(storeId);
			var index	= store.find('_id', val);
			var rec		= store.getAt(index);
			var ret		= rec ? rec.get('label') || rec.get('name') || rec.get('title') || '###' : val;
			return Ext.util.Format.htmlEncode(ret);
		};
		return {
			id:			id,
			dataIndex:	id,
			header:		label,
			sortable:	true,
			width:		width,
			renderer:	renderer
		};
	},
	check:	function(id, label, width) {
		return {
			id:			id,
			dataIndex:	id,
			header:		label,
			sortable:	true,
			width:		width,
			renderer:	format.bool,
			align:		'center',
			editor:		new Ext.form.Checkbox()
		};
	},
	date:	function(id, label, width) {
		return {
			id:			id,
			dataIndex:	id,
			header:		label,
			sortable:	true,
			width:		width,
			renderer:	Ext.util.Format.dateRenderer('Y.n.j')
		};
	},
	combo:	function(id, label, width, storeId) {
		var store = getStore(storeId);
		var combo = new Ext.form.ComboBox({
			forceSelection:	true,
			mode:			'local',
		    selectOnFocus:	true,
			triggerAction:	'all',
			displayField:	'label',
			valueField:		'_id',
		    typeAhead:		true,
		    emptyText:		'選択してください…',
		    store:			store
		});
		var renderer = function(val) {
			var index	= store.find('_id', val);
			var rec		= store.getAt(index);
			var ret		= rec ? rec.get('label') || rec.get('name') || rec.get('title') || '###' : val;
			return Ext.util.Format.htmlEncode(ret);
		};
		return {
			id:			id,
			dataIndex:	id,
			header:		label,
			sortable:	true,
			width:		width,
			renderer:	renderer,
			editor:		combo
		};
	}
};

// ************************
// base64
// http://extjs.com/forum/showthread.php?p=167166
// ************************

Ext.util.base64 = {

    base64s : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    
    encode: function(decStr){
        if (typeof btoa === 'function') {
             return btoa(decStr);            
        }
        var base64s = this.base64s;
        var bits;
        var dual;
        var i = 0;
        var encOut = "";
        while(decStr.length >= i + 3){
            bits = (decStr.charCodeAt(i++) & 0xff) <<16 | (decStr.charCodeAt(i++) & 0xff) <<8 | decStr.charCodeAt(i++) & 0xff;
            encOut += base64s.charAt((bits & 0x00fc0000) >>18) + base64s.charAt((bits & 0x0003f000) >>12) + base64s.charAt((bits & 0x00000fc0) >> 6) + base64s.charAt((bits & 0x0000003f));
        }
        if(decStr.length -i > 0 && decStr.length -i < 3){
            dual = Boolean(decStr.length -i -1);
            bits = ((decStr.charCodeAt(i++) & 0xff) <<16) |    (dual ? (decStr.charCodeAt(i) & 0xff) <<8 : 0);
            encOut += base64s.charAt((bits & 0x00fc0000) >>18) + base64s.charAt((bits & 0x0003f000) >>12) + (dual ? base64s.charAt((bits & 0x00000fc0) >>6) : '=') + '=';
        }
        return(encOut);
    },
    
    decode: function(encStr){
        if (typeof atob === 'function') {
            return atob(encStr); 
        }
        var base64s = this.base64s;        
        var bits;
        var decOut = "";
        var i = 0;
        for(; i<encStr.length; i += 4){
            bits = (base64s.indexOf(encStr.charAt(i)) & 0xff) <<18 | (base64s.indexOf(encStr.charAt(i +1)) & 0xff) <<12 | (base64s.indexOf(encStr.charAt(i +2)) & 0xff) << 6 | base64s.indexOf(encStr.charAt(i +3)) & 0xff;
            decOut += String.fromCharCode((bits & 0xff0000) >>16, (bits & 0xff00) >>8, bits & 0xff);
        }
        if(encStr.charCodeAt(i -2) == 61){
            return(decOut.substring(0, decOut.length -2));
        }
        else if(encStr.charCodeAt(i -1) == 61){
            return(decOut.substring(0, decOut.length -1));
        }
        else {
            return(decOut);
        }
    }

}; 
