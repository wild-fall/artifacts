# ツールボックス

シングルファイルHTMLで作ったツール・ゲームのコレクションです。
ビルドや依存パッケージは不要で、各ツールはブラウザで `index.html` を開くだけで動きます。

## ツール一覧

| ツール | ディレクトリ | カテゴリ | 説明 |
| --- | --- | --- | --- |
| 🎯 ビンゴ | [bingo/](bingo/) | パーティー | 通常のビンゴを実施する。引いた数字の履歴も分かる。 |
| 🖼️ イラストビンゴ ジェネレーター | [bingocard/](bingocard/) | パーティー | オリジナルイラストをアップロードして、ランダム配置のビンゴカードを一括生成・印刷できる。 |
| 🎈 壁面飾りメーカー | [deco/](deco/) | パーティー | 好きなメッセージ文を1文字ずつデコって印刷する。 |
| 🚗 ぶんぶんドライブ | [bunbun-drive/](bunbun-drive/) | ゲーム | タップや ← → キーで車線を変えて、障害物をよけながら走るドライブゲーム。 |
| 🏃 モチまるダッシュ | [mochimaru-dash/](mochimaru-dash/) | ゲーム | モチまるがジャンプで障害物を飛び越えて走るアクションゲーム。長押しで高くジャンプ。 |
| 👗 にこにこブティック | [niconico-boutique/](niconico-boutique/) | ゲーム | おきゃくさんの おねがいに あわせて ふくや こものを えらぶ、おみせやさんごっこゲーム。 |
| ⚽ ナイターPK戦 | [pk-soccer/](pk-soccer/) | ゲーム | ナイター中継風のPK戦。キッカーではタイミングよく蹴って狙い、キーパーではゴールをタップして飛びつく。 |
| 💃 Dance Choreographer | [dance/](dance/) | ビジュアル | 肩・肘・股関節・膝の角度を拍ごとに設定して、棒人間のダンスを振り付け。GIFで書き出せる。 |

## 使い方

ルートの [index.html](index.html) がメニューページです。ブラウザで開くと、カテゴリで絞り込みながら各ツールに移動できます。

各ツールを直接開くこともできます。

```sh
open bingo/index.html
```

## ディレクトリ構成

```
.
├── index.html          # メニューページ
├── bingo/index.html
├── bingocard/index.html
├── deco/index.html
├── bunbun-drive/index.html
├── mochimaru-dash/index.html
├── niconico-boutique/index.html
├── pk-soccer/index.html
└── dance/index.html
```

## ツールの追加方法

1. `<ツール名>/index.html` として1ファイルで完結するHTMLを作成する。
2. ルートの `index.html` 内にある `tools` 配列に、次の形式でエントリを追加する。

```js
{
  name: 'ツール名',
  desc: '説明文',
  icon: '🎯',
  href: 'ディレクトリ名',
  tag: 'party',            // party / game / visual / util
  tagLabel: 'パーティー',
  tagClass: 'tag-party',   // tag-party / tag-game / tag-visual / tag-util / tag-data
  thumb: 'thumb-pink',     // thumb-pink / blue / purple / green / amber / teal
  date: 'YYYY-MM',
  type: 'シングルHTML',
},
```

ツール数の表示とカテゴリの絞り込みは自動で反映されます。
