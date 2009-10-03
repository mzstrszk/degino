# -*- coding: utf-8 -*-
###################################################
# Degino Ver.1 (Ryoma)
# Copyright (c) 2009 Y.Tokutomi
# Licensed under GPLv3
# http://www.gnu.org/licenses/gpl-3.0.html
#
# info@degino.com
###################################################

####################
# リクエストハンドラー #
####################

import logging
import datetime
import hashlib
import base64
import random
from django.utils import simplejson
from xml.sax.saxutils import *
from google.appengine.api import mail
from google.appengine.ext import db
from google.appengine.ext import webapp
from google.appengine.api import memcache
from google.appengine.ext.webapp import template
import models

# クエリー管理
class QueryMan:
	@staticmethod
	def public(model, user_id):
		gql = 'select * from %s where disabled=False AND isPublic=True AND owner_id!=:1 order by owner_id ASC' % model
		return db.GqlQuery(gql, user_id)

	@staticmethod
	def mine(model, user_id):
		gql = 'select * from %s where disabled=False AND owner_id=:1 order by created ASC' % model
		return db.GqlQuery(gql, user_id)

	@staticmethod
	def children(model, parent, value):
		gql = 'select * from %s where disabled=False AND %s=:1 order by created ASC' % (model, parent)
		return db.GqlQuery(gql, value)

	@staticmethod
	def enable(model):
		gql = 'select * from %s where disabled=False order by created ASC' % model
		return db.GqlQuery(gql)

# 抽象ハンドラー
class Handler(webapp.RequestHandler):
	user_id	= None

	def auth(self):
		ret			= False
 		loginkey	= self.request.cookies.get('loginkey', None)
		if loginkey:
			self.user_id = memcache.get(loginkey)
			ret = memcache.replace(loginkey, self.user_id, 3600*24)

		return ret

# 抽象ウェブページ (&メインページ)
class BasePage(Handler):
	page = 'pageAuth'

	def get(self):
		if self.auth():
			self.response.out.write(template.render('%s.html' % self.page, {}))
		else:
			self.redirect("/Auth")

class BaseAjax(Handler):
	params	= {}

	def post(self):
		if not self.auth():
			return {'success': False, 'MSG': 'Access denied.'}

		logging.info('DevAjax Request: _MSG(%s) _MODEL(%s) _id(%s) _PARENT(%s)' %
			(self.request.get('_MSG'), self.request.get('_MODEL'), self.request.get('_id'), self.request.get('_PARENT')))

		# リクエストからパラメータ取り出し
		self.params = {}
		for it in self.request.arguments():
			self.params[it] = self.request.get(it)

		ret = self.dispatch()

		# レスポンス
		self.response.content_type = 'application/json'
		json = simplejson.dumps(ret, ensure_ascii=False)
#		logging.debug('JSON: %s' % json)
		self.response.out.write(json)


# 設計画面用 ajax 処理クラス
class DevAjax(BaseAjax):
	user_id	= None
	params	= {}
	mdl		= {
		'Table':	models.Table,
		'Element':	models.Element,
		'File':		models.File,
		'Appli':	models.Appli,
		'Channel':	models.Channel,
		'Panel':	models.Panel,
		'Account':	models.Account
	}
	qinfo	= {
		'Table':	{'type':'PERMITTED',	'model':'Table'},
		'Element':	{'type':'CHILDREN',		'model':'Element',	'parent':'table_id'},
		'Element2':	{'type':'CHILDREN',		'model':'Element',	'parent':'table_id'},
		'File':		{'type':'PERMITTED',	'model':'File'},
		'File3':	{'type':'ENABLE',		'model':'File'},
		'Appli':	{'type':'MINE',			'model':'Appli'},
		'Appli2':	{'type':'PERMITTED',	'model':'Appli'},
		'Channel':	{'type':'CHILDREN',		'model':'Channel',	'parent':'appli_id'},
		'Panel':	{'type':'CHILDREN', 	'model':'Panel',	'parent':'channel_id'},
		'Account':	{'type':'ENABLE',		'model':'Account'}
	}

	def dispatch(self):
		funcs = {
			'SELECT':	self.select,
			'REBUILD':	self.rebuild,
			'ADD':		self.add,
			'UPDATE':	self.update,
			'REMOVE':	self.remove,
			'USER':		self.user
		}
		return funcs[self.request.get('_MSG')]()

	def select(self):
		model	= self.request.get('_MODEL', None)
		parent	= long(self.request.get('_PARENT', 0))

		# クエリー取得
		query	= None
		recs	= None
		info	= self.qinfo[model]
		if info['type'] == 'MINE':
			query = QueryMan.mine(info['model'], self.user_id)
			recs  = self.getrecs(query)

		elif info['type'] == 'PUBLIC':
			query = QueryMan.public(info['model'], self.user_id)
			recs  = self.getrecs(query)

		elif info['type'] == 'CHILDREN':
			query = QueryMan.children(info['model'], info['parent'], parent)
			recs  = self.getrecs(query)

		elif info['type'] == 'ENABLE':
			query = QueryMan.enable(info['model'])
			recs  = self.getrecs(query)

		elif info['type'] == 'PERMITTED':
			query = QueryMan.mine(info['model'], self.user_id)
			recs  = self.getrecs(query)

			query = QueryMan.public(info['model'], self.user_id)
			recs += self.getrecs(query)

		else:
 			raise RuntimeError, 'Unknown request.'

		logging.info('DavAjax select _MODEL: Result %d records.' % len(recs))

		return {'recs': recs}

	# エンティティ取得 & JSON 向けリスト化
	def getrecs(self, query):
		recs = []
		for it in query.fetch(1000):
			recs.append(it.record())

		return recs


	# Appli 組み込み前に作られたチャネルを最初のアプリにぶら下げる処理
	def rebuild(self):
		# アプリの id 取得
		gql = QueryMan.mine('Appli', self.user_id)
		rec = gql.get()
		appli_id = rec.key().id_or_name()

		# チャネルのアプリ id をセット
		gql = QueryMan.mine('Channel', self.user_id)
		for it in gql.fetch(1000):
			logging.debug('appli_id = %s' % it.appli_id)
			if it.appli_id == 0:
				it.appli_id = appli_id
				it.put()

		return {'success': True}

	def add(self):
		# デフォルトレコード作成
		rec = self.mdl[self.request.get("_MODEL")].newdefault(self.params, self.user_id)

		# 書き込み
		rec.put()

		return {"success": True, '_id': str(rec.key().id_or_name())}

	def update(self):
		# モデル更新
		model	= self.mdl[self.request.get('_MODEL')]
		rec		= model.get_by_id(long(self.params['_id']))
		rec.setByRequest(self.params)
		rec.put()

		return {'success': True}

	def remove(self):
		# 無効化
		rec = self.mdl[self.request.get('_MODEL')].get_by_id(long(self.params['_id']))
		rec.disabled = True
		rec.put()

		return {'success': True}

	def user(self):
		acc = memcache.get('Account%s' % self.user_id)
		if not acc:
			acc = models.Account.get_by_id(self.user_id)
			ret = memcache.set('Account%s' % self.user_id, acc, 3600*24)

		rec = acc.record()
		ret = {
			'_id':		rec['_id'],
			'nickname':	rec['nickname'] or rec['nickname'].split('@')[0]
		}

		return {'success': True, 'recs': ret}

# ユーザー認証
class AuthPage(webapp.RequestHandler):
	def get(self):
		msg = ''
		if self.request.get('CONFORM', None) != None:
			msg = self.conform()

		self.response.out.write(template.render("pageAuth.html", {'msg':msg}))

	def conform(self):
		msg = ''
		authkey	= self.request.get('CONFORM')
		query = models.Account.queryForConform(authkey)
		count = query.count()

		if count == 0:
			return 'キーが無効です。登録手続きをやり直してください。'

		if count > 1:		
			raise RuntimeError, 'Too many authkeies.'

		rec = query.get()
		if rec.license > 0:
			return '登録手続きは完了しています。ログインできます。'

#		rec.authkey		= None
		rec.license		= 1
		rec.registered	= datetime.datetime.today()
		rec.put()

		self.response.headers.add_header('Set-Cookie', 'mail=%s; expires=Tue, 1-Jan-2030 00:00:00 GMT;' % rec.mail)

		return '登録手続きが完了しました。ログインできます。'

	def post(self):
		funcs = {
			'_REGIST':	self.regist,
			'_LOGIN':	self.login,
			'_LOGOUT':	self.logout,
			'_CHECK':	self.check
		}

		logging.info('AuthPage Request: _MSG(%s)' % (self.request.get('_MSG')))

		try:
			ret = funcs[self.request.get("_MSG")]()
			self.response.content_type = "application/json"
			json = simplejson.dumps(ret, ensure_ascii=False)
			logging.debug("JSON: %s", json)
			self.response.out.write(json)
		except RuntimeError, e:
			logging.error(e.args[0])
			

	def regist(self):
		# アドレスチェック
  		if not mail.is_email_valid(self.request.get('mail')):
			return {'success':False, 'MSG': 'It is wrong e-mail address.'}

		# 既存チェック
		query = models.Account.queryForRegist(self.request.get('mail'))
		if query.count() > 0:
			return {'success':False, 'MSG': 'It is already registered.'}

		# パラメータからデータ取り出し
		vals = {}
		for it in self.request.arguments():
			vals[it] = self.request.get(it)

		# アカウントレコード作成
		rec = models.Account.newdefault(vals, 0)
		rec.put()

		# メール送信
		sender		= 'conformation@degino.com'
		receiver	= rec.mail
		subject		= 'Degino conformation'
		body		= '''
		[Degino 認証]

		次の URL をクリックして、登録手続きを完了してください。

		http://%s/Auth?CONFORM=%s
		''' % ('app.degino.com', rec.authkey)
		mail.send_mail(sender, receiver, subject, body)

		return {'success': True}

	def login(self):
		# 既存チェック
		query = models.Account.queryForLogin(self.request.get('mail'))
		if query.count() > 1:
			raise RuntimeError, 'Too many accounts.'
		if query.count() == 0:
			return {'success': False, 'MSG': 'Access ignored.'}

		today	= datetime.date.today()
		word	= "%s%s%s" % (today.year, today.month, today.day)
		rec		= query.get()
		sha1	= hashlib.sha1('%s%s' % (word, rec.basehash)).hexdigest()

		if sha1 != self.request.get('sign'):
			return {'success': False}

		# 認証キーを Cookie へ
		loginkey	= base64.urlsafe_b64encode(str(random.random()))
		expires		= datetime.datetime.today() + datetime.timedelta(days=1)
		expires_str	= expires.strftime('%a, %d-%b-%Y %H:%M:%S %Z')
		logging.debug("EXPIRE: %s" % expires_str)
		self.response.headers.add_header(
			'Set-Cookie', 'loginkey=%s; expires=%s;' % (loginkey, expires))

		# ログイン記録
		rec.loginkey	= loginkey
		rec.lastlogined	= datetime.datetime.today()
		rec.put()
		# メモリーキャッシュへキープ
		memcache.add(loginkey, rec.key().id_or_name(), 3600*24)

		return {'success': True}

	def logout(self):
 		loginkey	= self.request.cookies.get('loginkey', None)

		if loginkey:
			mail = memcache.delete(loginkey)
			self.response.headers.add_header('Set-Cookie', 'loginkey=0; expires=0;')

		return {'success': True}

	def check(self):
		ret			= False
 		loginkey	= self.request.cookies.get('loginkey', None)
		if loginkey:
			self.user_id = memcache.get(loginkey)
			ret = memcache.replace(loginkey, self.user_id, 3600*24)

		return {'success': ret}

class DevPage(BasePage):
	page		= 'pageDev'

class DevPageDebug(BasePage):
	page		= 'pageDevDebug'

class ManagePage(BasePage):
	page		= 'pageManage'

# ユーザーページ
class UserPage(BasePage):
	page = 'pageUser'

class UserPageDebug(UserPage):
	page = 'pageUserDebug'

# ユーザー画面用 ajax 処理クラス
class UserAjax(BaseAjax):
	user_id	= None

	# Ext JS フォーム用の型
	xtypes = {
		11:	'textfield',
		12:	'textarea',
		13: 'htmleditor',
		21:	'numberfield',
		22:	'numberfield',
		23:	'numberfield',
		31:	'datefield',
		32:	'datefield',
		33:	'timefield',
		41:	'checkbox',
		51:	'combo'
	}

	# Ext JS DataReader 用の型
	dtypes = {
		11:	{'type': 'string'},
		12:	{'type': 'string'},
		13:	{'type': 'string'},
		21:	{'type': 'int'},
		22:	{'type': 'int'},
		23:	{'type': 'int'},
		31:	{'type': 'date', 'dateFormat': 'Y.n.j H:i'},
		32:	{'type': 'date', 'dateFormat': 'Y.n.j'},
#		33:	{'type': 'date', 'dateFormat': 'H:i'},
		33:	{'type': 'string'},
		41: {'type': 'bool'},
		51: {'type': 'int'}
	}

	# Ext JS Grid 用の表示位置
	aligns = {
		21:	{'align': 'right'},
		22:	{'align': 'right'},
		23:	{'align': 'right'},
		41:	{'align': 'center'}
	}

	# Ext JS Grid 用のレンダリング指定
	renderers = {
		11:	{'renderer': 'text'},
		12:	{'renderer': 'text'},
		13:	{'renderer': 'text'},
		31: {'renderer': 'datetime'},
		32: {'renderer': 'date'},
#		33: {'renderer': 'time'},
		33: {'renderer': 'text'},
		41:	{'renderer': 'bool'}
	}

	def dispatch(self):
		funcs = {
			"CHANNEL":	self.channel,
			"_LIST":	self.rec_list,
			"_ADD":		self.rec_add,
			"_REMOVE":	self.rec_remove,
			"_UPDATE":	self.rec_update
		}

		return funcs[self.request.get("_MSG")]()

	# チャネル内のパネル情報一式を取得
	def channel(self):
		# TODO: memcache 化
		channel_id = long(self.request.get('channel_id'))
		query = QueryMan.children('Panel', 'channel_id', channel_id)

		panels = []
		for it in query.fetch(1000):
			panel = it.record()
			panel['_id'] = 'Panel%s' % it.key().id_or_name(),

			panel.update(self.columns(it.file_id))
			panels.append(panel)

		return panels

	# コラム情報取得
	def columns(self, file_id):
		temp	= models.File.get_by_id(file_id)

		query = db.GqlQuery("select * from Element where table_id = :1 order by created ASC", temp.table_id)

		columns		= []										# グリッド用
		columns2	= []										# グリッド用
		elements	= [{"name": '_id'}]							# ストアリーダー用
		fields		= [{"xtype": "hidden", "name": '_id'}]		# フォーム用
		for it in query.fetch(1000):
			elements.append(self.def_storefield(it.key().id_or_name(), it.f_type))
			columns.append(self.def_gridcolumn(it))
			columns2.append(self.def_editorgridcolumn(it))
			fields.append(self.def_formitem(it))

		return {'columns': columns, 'columns2':columns2, 'elements': elements, 'fields': fields}

	# ストア項目定義
	def def_storefield(self, key, f_type):
		ret = {"name": "f_%d" % key}
		opt = self.dtypes[f_type]
		if (opt != None):
			ret.update(opt)		
		return ret

	# グリッド項目定義
	def def_gridcolumn(self, info):
		ret = {
			'header':		escape(info.name),
			'sortable':		True,
			'dataIndex':	'f_%d' % info.key().id_or_name()
		}
		if self.aligns.get(info.f_type, None):
			ret.update(self.aligns[info.f_type])
		if self.renderers.get(info.f_type, None):
			ret.update(self.renderers[info.f_type])

		return ret

	# エディターグリッド項目定義
	def def_editorgridcolumn(self, info):
		ret		= self.def_gridcolumn(info)
		if info.f_type == 23:	# シーケンス
			return ret

		editor	= {
			'xtype':		self.xtypes[info.f_type],
			'allowBlank':	not info.isRequired
		}
		if (editor['xtype'] == 'combo'):
			temp = {
				'hiddenName':		'f_%d' % info.key().id_or_name(),
				'allowBlank':		not info.isRequired,
				'store':			info.option,
				'displayField':		'label',
				'triggerAction':	'all',
				'valueField':		'code',
				'mode':				'local'
			}
			editor.update(temp)

		if (info.f_type == 31):		# 日時
			temp = {
				'format':	'Y.n.j H:i'
			}
			editor.update(temp)

		if (info.f_type == 32):		# 日付
			temp = {
				'format':	'Y.n.j'
			}
			editor.update(temp)

		if (info.f_type == 33):		# 時刻
			temp = {
				'format':	'H:i'
			}
			editor.update(temp)

		ret['editor'] = editor

		return ret

	# フォーム項目定義
	def def_formitem(self, info):
		xtype = self.xtypes[info.f_type]

		ret = {}
		if (xtype == 'combo'):
			ret = {
				'xtype':			xtype,
				'hiddenName':		'f_%d' % info.key().id_or_name(),
				'fieldLabel':		escape(info.name),
				'allowBlank':		not info.isRequired,
				'store':			info.option,
				'displayField':		'label',
				'triggerAction':	'all',
				'valueField':		'code',
				'mode':				'local',
				'emptyText':		u'未選択'
			}
		elif (xtype == 'htmleditor'):
			ret = {
				'xtype':			xtype,
				'name':				'f_%d' % info.key().id_or_name(),
				'fieldLabel':		escape(info.name),
				'allowBlank':		not info.isRequired,
				'width':			530
			}
		else:
			ret = {
				'xtype':			xtype,
				'name':				'f_%d' % info.key().id_or_name(),
				'fieldLabel':		escape(info.name),
				'allowBlank':		not info.isRequired
# 				'width':			300
			}

		if (info.f_type == 31):		# 日時
			temp = {
				'format':	'Y.n.j H:i'
			}
			ret.update(temp)

		if (info.f_type == 32):		# 日付
			temp = {
				'format':	'Y.n.j'
			}
			ret.update(temp)

		if (info.f_type == 33):		# 時刻
			temp = {
				'format':	'H:i'
			}
			ret.update(temp)

		return ret

	# 一覧取得 (汎用)
	def rec_list(self):
		model	= self.request.get("_MODEL")
		parent	= long(self.request.get("_PARENT"))

		query	= QueryMan.children('Record', 'file_id', parent)

		recs = []
		if model == 'RowRecord':
			for it in query.fetch(1000):
				recs.append(it.rowrecord())
		else:
			for it in query.fetch(1000):
				recs.append(it.record())

		logging.debug("UserPage.rec_list: Result %d recs." % len(recs))

		return {"recs": recs}

	# レコード新規作成
 	def rec_add(self):
		file_id	= long(self.request.get('_PARENT'))

		# 項目仕様収集
		tmp_file	= models.File.get_by_id(file_id)
		query		= QueryMan.children('Element', 'table_id', tmp_file.table_id)

		# シーケンス補正
		seqs = []
		for it in query.fetch(1000):
			if it.f_type == 23:
				seqs.append(it.key().id_or_name())

		# パラメータ名収集
		args = []
		for it in self.request.arguments():
			if (it[0] == '_'):
				continue
			args.append(it)

		# ディクショナリ化
		values = {}
		for it in args:
			values[it] = self.request.get(it)

		# シーケンス補正
		for it in seqs:
			values['f_%d' % it] = models.Sequence.next_val(file_id, it)

		# レコード生成
		record = models.Record(
			owner_id	= self.user_id,
			file_id		= long(self.request.get("_PARENT")),
			json		= simplejson.dumps(values, ensure_ascii=False)
		)
		record.put()

		# 戻り値生成
		ret = {'success': True, '_id': str(record.key().id_or_name())}

		# シーケンス補正
		for it in seqs:
			ret['f_%d' % it] = values['f_%d' % it]

		return ret

	# レコード無効化
	def rec_remove(self):
		# 元データ取得
		rec	= models.Record.get_by_id(long(self.request.get('_id')))

		# owner 不明の場合の処理 (旧レコードへの修正対応)
		if not rec.owner_id:
			rec.owner_id = self.user_id

		rec.disabled = True
		rec.put()

		return {"success": True}

	# レコード更新
	def rec_update(self):
		# 元データ取得
		rec	= models.Record.get_by_id(long(self.request.get('_id')))
		org	= simplejson.loads(rec.json)

		# owner 不明の場合の処理 (旧レコードへの修正対応)
		if not rec.owner_id:
			rec.owner_id = self.user_id

		# リクエストからパラメータ取り出し
		params = {}
		for it in self.request.arguments():
			if it[0] != '_':
				params[it] = self.request.get(it)

		org.update(params)

		rec.json		= simplejson.dumps(org, ensure_ascii=False)
		rec.put()

		return {"success": True}

# Panel コンフィグ生成
class ExtPanelGen(BaseAjax):

	# Ext JS DataReader 用の型
	dtypes = {
		11:	{'type': 'string'},
		12:	{'type': 'string'},
		13:	{'type': 'string'},
		21:	{'type': 'int'},
		22:	{'type': 'int'},
		23:	{'type': 'int'},
#		31:	{'type': 'date', 'dateFormat': 'Y.n.j H:i'},
#		32:	{'type': 'date', 'dateFormat': 'Y.n.j'},
#		33:	{'type': 'date', 'dateFormat': 'H:i'},
		31:	{'type': 'string'},
		32:	{'type': 'string'},
		33:	{'type': 'string'},
		41: {'type': 'bool'},
		51: {'type': 'int'}
	}

	# Ext JS Grid 用の表示位置
	aligns = {
		21:	{'align': 'right'},
		22:	{'align': 'right'},
		23:	{'align': 'right'},
		41:	{'align': 'center'}
	}

	# Ext JS Grid 用のレンダリング指定
	renderers = {
		11:	{'renderer': 'text'},
		12:	{'renderer': 'text'},
		13:	{'renderer': 'text'},
		31: {'renderer': 'datetime'},
		32: {'renderer': 'date'},
#		33: {'renderer': 'time'},
		33: {'renderer': 'text'},
		41:	{'renderer': 'bool'}
	}

	# Ext JS フォーム用の型 (& EditorGridPanel のエディタ)
	xtypes = {
		11:	'textfield',
		12:	'textarea',
		13: 'htmleditor',
		21:	'numberfield',
		22:	'numberfield',
		23:	'numberfield',
		31:	'datefield',
		32:	'datefield',
		33:	'timefield',
		41:	'checkbox',
		51:	'combo'
	}

	# ディスパッチャー
	def dispatch(self):
		channel_id = long(self.request.get('_id'))

		channel	= models.Channel.get_by_id(channel_id)

		# ストア定義取得
		stores = self.getstores(channel_id)

		# パネル定義取得
		items = self.getpanels(channel_id)

		ptype = {
			0:	'pnlanchor',
			1:	'pnlcard',
			2:	'pnltab',
			11:	'pnlcolumn2',
			91:	'pnlfit'
		};

		channeltype = channel.channeltype
		if channeltype == 1 and items.count < 2:
			channeltype = 91;

		panels = {
			'xtype':	ptype[channeltype],
			'id':		'WORK%d' % channel_id,
			'items':	items
		};

		return {'panels': panels, 'stores': stores}

	# チャネル内の JsonStore のコンフィグを生成
	def getstores(self, channel_id):
		stores	= []
		query	= QueryMan.children('Panel', 'channel_id', long(self.request.get('_id')))

		check = {}
		for it in query.fetch(1000):
			if (it.file_id not in check):
				check[it.file_id] = True
				fields = self.getstorefields(it.file_id)
	
				config = {
					'baseParams':	{
						'_MSG': 	'_LIST',
						'_MODEL':	'Record',
						'_PARENT':	it.file_id
					},
					'storeId':	'Store%s' % it.file_id,
					'fields':	fields
				}
	
				stores.append(config)

		return stores

	# パネル内の JsonStore のコンフィグを生成
	def getstorefields(self, file_id):
		temp	= models.File.get_by_id(file_id)
		query	= QueryMan.children('Element', 'table_id', temp.table_id)

		fields	= []
		for it in query.fetch(1000):
			field = {'name': 'f_%d' % it.key().id_or_name()}

			if it.f_type in self.dtypes:
				field.update(self.dtypes[it.f_type])
			
			fields.append(field)

		return fields

	# チャネル内の Panel のコンフィグを生成
	def getpanels(self, channel_id):
		panels	= []

		query	= QueryMan.children('Panel', 'channel_id', channel_id)

		for it in query.fetch(1000):
			config	= {'storeId': 'Store%s' % it.file_id}

			if it.paneltype == 1:	# 折線グラフ
					config.update(self.getLineChart(it.file_id))

			elif it.paneltype == 2:	# 棒グラフ
					config.update(self.getColumnChart(it.file_id))

			elif it.paneltype == 3:	# 円グラフ
					config.update(self.getPieChart(it.file_id))

			elif it.paneltype == 4:	# スライド
					config.update(self.getSlidePanel(it.file_id))

			else:					# 表
				if it.edittype == 1:	# 直接編集
					config.update(self.getEditorGridPanel(it.file_id))

				elif it.edittype == 2:	# 横フォーム
					config.update(self.getGridForm(it.file_id))

				elif it.edittype == 3:	# 別ウィンドウ
					config.update(self.getGridWindow(it.file_id))

				else:					# 編集なし
					config.update(self.getGridPanel(it.file_id))

			panels.append(config)

		return panels

	def getGridPanel(self, file_id):
		conf = {
			'xtype': 	'ugrid',
			'columns':	self.getgridcolumns(file_id, True)
		}

		return conf

	def getEditorGridPanel(self, file_id):
		conf = {
			'xtype': 	'uegrid',
			'columns':	self.getgridcolumns(file_id, True)
		}

		return conf

	def getGridForm(self, file_id):
		conf = {
			'xtype': 	'ugridform',
			'columns':	self.getgridcolumns(file_id, True)
		}

		return conf

	def getGridWindow(self, file_id):
		conf = {
			'xtype': 	'ugridwin',
			'columns':	self.getgridcolumns(file_id, True)
		}

		return conf

	# GridPanel のカラム全体定義を生成
	def getgridcolumns(self, file_id, editable):
		temp	= models.File.get_by_id(file_id)
		query	= QueryMan.children('Element', 'table_id', temp.table_id)

		columns	= []
		for it in query.fetch(1000):
			if editable:
				columns.append(self.getecolumn(it))
			else:
				columns.append(self.getcolumn(it))

		return columns

	# GridPanel のカラム定義
	def getcolumn(self, element):
		column = {
			'header':		escape(element.name),
			'sortable':		True,
			'dataIndex':	'f_%d' % element.key().id_or_name()
		}

		if element.f_type in self.aligns:
			column.update(self.aligns[element.f_type])

		if element.f_type in self.renderers:
			column.update(self.renderers[element.f_type])

		return column
	
	# EditorGridPanel のカラム定義
	def getecolumn(self, element):
		column		= self.getcolumn(element)
		if element.f_type == 23:	# シーケンス
			return column

		editor	= {
			'xtype':		self.xtypes[element.f_type],
			'allowBlank':	not element.isRequired
		}
		if (editor['xtype'] == 'combo'):
			temp = {
				'hiddenName':		'f_%d' % element.key().id_or_name(),
				'allowBlank':		not element.isRequired,
				'store':			element.option,
				'displayField':		'label',
				'triggerAction':	'all',
				'valueField':		'code',
				'mode':				'local'
			}
			editor.update(temp)

		formats = {
			31:	'Y.n.j H:i',			# 日時
			32: 'Y.n.j',				# 日付
			33: 'H:i'					# 時刻
		}
		if element.f_type in formats:
			editor.update({'format': formats[element.f_type]})

		column['editor'] = editor

		return column

	def getLineChart(self, file_id):
		conf = {'xtype': 'uline'}
		conf.update(self.getchartconf1(file_id))

		return conf

	def getColumnChart(self, file_id):
		conf = {'xtype': 'ucolumn'}
		conf.update(self.getchartconf1(file_id))

		return conf

	def getPieChart(self, file_id):
		conf = {'xtype': 'upie'}

		return conf

	# LineChart, BarChart 用の Field 情報を生成
	def getchartconf1(self, file_id):
		temp	= models.File.get_by_id(file_id)
		query	= QueryMan.children('Element', 'table_id', temp.table_id)

		conf = {'series': []}
		for it in query.fetch(1000):
			if it.f_type in (11, 31, 32, 33):	# 文字列、日時類
				if 'xField' not in conf:
					conf['xField'] = 'f_%d' % it.key().id_or_name()

			if it.f_type in (21, 22):			# 数値、通貨
				conf['series'].append({'yField': 'f_%d' % it.key().id_or_name()})

		return conf

	def getSlidePanel(self, file_id):
		conf = {
			'xtype': 	'uslide',
#			'xtype': 	'ugrid',
			'columns':	self.getgridcolumns(file_id, True)
		}
	
		return conf
