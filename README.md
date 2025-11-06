## ポートフォリオ（写真掲載サイト）

自分が撮影した写真が一覧で閲覧できるサービスです。

1. フロントエンドはHTML,CSS,Javascriptで作成し、Github pagesで公開。
2. バックエンドは他のサービス向けに作成したmicorCMS APIを叩く独自API（Google Cloud Run上で動作するPython(FastAPI)を叩き、microCMSに登録されたデータを取得する。
3. 画像データ自体はGoogle Cloud Strage上のバケットに保存されており、microCMSにはコメントとデータ保存場所URLのみ登録され、画像はmicroCMSを経由せずバケットから直配信される。
