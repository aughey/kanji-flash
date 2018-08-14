import React, {Component} from 'react';
import './App.css';
import OrigKanjiData from './kanji.json'

import SpacedRepetition from './MySpacedRepetition'
const sr_config = {
  'bad': '5 minutes',
  'new': 300000, // in milliseconds (5 minutes)
  'fresh': '1 day',
  'average': '5 days',
  'old': '14 days'
}


// Unpack this into our preferred format
var KanjiData = {}
OrigKanjiData.forEach((r) => {
  KanjiData[r[2]] = {
    front: {
      lang: 'jp',
      text: r[0]
    },
    back: {
      lang: 'en',
      text: r[1]
    }
  }
})

// Helper function to get an element's exact position
function getElPosition(el) {
  var xPos = 0;
  var yPos = 0;

  while (el) {
    if (el.tagName === "BODY") {
      // deal with browser quirks with body/window/document and page scroll
      var xScroll = el.scrollLeft || document.documentElement.scrollLeft;
      var yScroll = el.scrollTop || document.documentElement.scrollTop;

      xPos += (el.offsetLeft - xScroll + el.clientLeft);
      yPos += (el.offsetTop - yScroll + el.clientTop);
    } else {
      // for all other non-BODY elements
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
    }

    el = el.offsetParent;
  }
  return {x: xPos, y: yPos};
}

class Card extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.scale = 1.0;
    this.state = {
      width: 0,
      height: 0
    };
  }

  componentDidMount() {
    //  this.updateWindowDimensions();
    window.addEventListener('resize', this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    //console.log("UPDATE WINDOW DIM")
    var el = this.ref.current;
    var pos = getElPosition(el);
    var rect = el.getBoundingClientRect();
    var base_font_size = window.getComputedStyle(el, null).getPropertyValue('font-size')

    //console.log(rect);

    this.setState({
      sizes: {
        render_text: this.render_text,
        base_font_size: base_font_size,
        window_size: {
          width: window.innerWidth - 20, // 20 px for padding
          height: window.innerHeight - pos.y
        },
        element_size: {
          width: rect.width / this.scale,
          height: rect.height / this.scale
        }
      }
    });
  }

  render() {
    var card = this.props.card;

    var side;
    if (card) {
      side = card[this.props.side];
    } else {
      side = {
        text: "NO CARD"
      }
      card = {}
    }

    var style = {}
    // if (side.lang !== 'en' && this.state.height) {
    //   style['fontSize'] = Math.min(this.state.width, this.state.height) / 1.5 + 'px';
    // }
    // If we have rendered the element, have the element sizes, and the text hasn't
    // changed since the last time, update the font size
    if (this.ref.current && this.state.sizes && this.state.sizes.render_text === side.text) {
      var sizes = this.state.sizes;
      var windowratio = sizes.window_size.width / sizes.window_size.height;
      var elratio = sizes.element_size.width / sizes.element_size.height;
      var scalekey;
      if (windowratio < elratio) {
        scalekey = 'width';
      } else {
        scalekey = 'height';
      }
      //var base_font_size = 50; //sizes.base_font_size;
      //base_font_size = parseFloat(base_font_size)
      //var base_font_size = this.fontsize;
      var font_scale = (sizes.window_size[scalekey] / sizes.element_size[scalekey])
      //var fontsize = base_font_size * font_scale;
      //console.log(base_font_size + " => " + fontsize)
      //style['fontSize'] = fontsize + "px";

      style['transform'] = "scale(" + font_scale + ")"
      style['transformOrigin'] = '50% 0 0'

      this.scale = font_scale;
    } else {
      // Let it do a cycle
      window.requestAnimationFrame(this.updateWindowDimensions);
      this.scale = 1.0;
      style['color'] = 'white'; // Make's it "invisible"
      // Should try
      // .measure {
      //   position: absolute;
      //   visibility: hidden;
      //   left: -1000px;
      //   top: -1000px;
      // }
    }

    this.render_text = side.text;

    return (<div ref={this.ref} className={'card card-' + side.lang} style={style}>
    <div className="card-text">{side.text}</div>
    </div>)
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [
      array[i], array[j]
    ] = [
      array[j], array[i]
    ]; // eslint-disable-line no-param-reassign
  }
}

// function insertSorted(arr, value, key) {
//   var totest = value[key];
//   for (var i = 0, len = arr.length; i < len; i++) {
//     if (totest < arr[i][key]) {
//       arr.splice(i, 0, value);
//       return;
//     }
//   }
//    Put it at the end
//   arr.push(value);
// }

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      from_index: 1,
      to_index: 20
    }

    try {
      var obj = JSON.parse(localStorage.getItem("INDICES"))
      this.state.from_index = obj.from_index
      this.state.to_index = obj.to_index
    } catch (e) {
      console.log(e)
    }

    try {
      var badwords = JSON.parse(localStorage.getItem("BADWORDS"))
      this.state.badwords = badwords;
    } catch (e) {}

    if (!this.state.badwords) {
      this.state.badwords = [];
    }
  }
  options = () => {
    this.setState({
      options: !this.state.options
    })
  }
  set = (key, value) => {
    var obj = {}
    obj[key] = value;
    this.setState(obj);
  }

  saveBadWords(words) {
    try {
      localStorage.setItem("BADWORDS", JSON.stringify(words));
    } catch (e) {}
  }

  onBad = (word) => {
    this.setState((s) => {
      if (-1 === s.badwords.findIndex((w) => w.front.text === word.front.text)) {
        var newwords = s.badwords.slice();
        newwords.push(word);
        this.saveBadWords(newwords);
        return {badwords: newwords}
      } else {
        return null
      }
    })
  }

  removeAllBad = () => {
    this.setState({badwords: []})
  }

  removeBad = (word) => {
    this.setState((s) => {
      var newwords = s.badwords.slice();
      newwords.splice(newwords.indexOf(word), 1);
      this.saveBadWords(newwords);
      return {badwords: newwords}

    })
  }

  showBadWords = () => {
    this.setState((s) => ({
      show_badwords: !s.show_badwords
    }))
  }

  render() {


    function getNumber(v) {
      v = parseInt(v, 10);
      if (!v) {
        v = 0;
      }
      return v;
    }

    var from = getNumber(this.state.from_index);
    var to = getNumber(this.state.to_index);

    if (localStorage) {
      var to_store = {
        from_index: from,
        to_index: to
      }
      localStorage.setItem("INDICES", JSON.stringify(to_store));
    }

    var app_to_show;
    if (this.state.show_badwords) {
      app_to_show = (<BadWords badwords={this.state.badwords} onRemoveWord={this.removeBad} onRemoveAll={this.removeAllBad}/>)
    } else   if (this.state.options) {
      app_to_show = (<div>
        <div className="range">
          Show cards from RTK index
          <input value={this.state.from_index} onChange={e => this.set('from_index', e.target.value)}/>
          to
          <input value={this.state.to_index} onChange={e => this.set('to_index', e.target.value)}/>
        </div>
      </div>)
    } else {
      app_to_show = (<CardApp starting_state='back' from_index={from} to_index={to} onBad={this.onBad}/>)
    }

    return (<div className="App">
      <div className="btn-group" role='group'>
        <button className='btn btn-default' onClick={this.options}>Options</button>
        <button className='btn btn-default' onClick={this.showBadWords}>Bad Words</button>
      </div>
      {app_to_show}
    </div>);
  }
}

class BadWords extends Component {
  render() {
    var words = this.props.badwords.map((w) => {
      return (<li key={w.front.text}>
        <button className='btn btn-danger' onClick={() => this.props.onRemoveWord(w)}>Remove</button>{w.front.text}
        - {w.back.text}</li>)
    })
    return (<div className="badwords">
      <h2>Bad Words</h2>
      <button className='btn btn-danger' onClick={() => this.props.onRemoveAll()}>Remove All</button>
      <ul>
        {words}
      </ul>
    </div>)
  }
}

class CardApp extends Component {
  constructor(props) {
    super(props);
    this.terminal_state = 'average'
    this.state = {
      front_or_back: this.starting_state(),
      cards: []
    };
    this.undo_stack = [];
  }

  starting_state() {
    return this.props.starting_state
  }

  static getCardStates(cards) {
    var states = {}
    cards.forEach((c) => CardApp.updateWordStateStructure(states, c.state, 1))
    return states;
  }

  static getDerivedStateFromProps(props, state) {
    if (props.from_index !== state.from_index || props.to_index !== state.to_index) {
      return CardApp.getShuffledCardsState(props.from_index, props.to_index)
    } else {
      return null;
    }
  }

  static getShuffledCardsState(begin, end) {
    // Make a copy
    var cards = [];
    const last_shown = new Date()
    const last_state = 'new'
    for (var i = begin; i <= end; ++i) {
      var card = KanjiData[i];
      if (!card) {
        //console.log("Missing Card index: " + i)
      } else {
        cards.push(card)
      }
    }

    shuffleArray(cards);

    // Transform the cards to SpacedRepetition words
    cards = cards.map((card) => {
      const word = new SpacedRepetition(last_shown, last_state, sr_config)
      word.card = card;
      return word;
    })

    return {cards: cards, from_index: begin, to_index: end, card_states: CardApp.getCardStates(cards), front_or_back: 'back'}
  }

  shuffle = () => {
    this.undo_stack = [];
    var shuffled_state = CardApp.getShuffledCardsState(this.state.from_index, this.state.to_index)
    shuffled_state.front_or_back = this.starting_state()
    this.setState(() => shuffled_state)
  }

  flip = () => {
    this.setState(() => ({
      front_or_back: this.state.front_or_back === 'front'
        ? "back"
        : 'front'
    }))
  }

  next = () => {
    this.setCard('good');
  }

  getCurrentWord() {
    //var cards = this.state.cards

    return this.state.cards[0];
    // for (var i = 0; i < cards.length; ++i) {
    //   var card = cards[i]
    //     return card;
    //   }
    // }
    // return null;
    //return cards[0];
  }

  getCurrentCard() {
    var word = this.getCurrentWord();
    if (word) {
      return word.card
    } else {
      return {
        front: {
          text: "NO CARDS"
        },
        back: {
          text: "NO CARDS"
        }
      };
    }
  }

  static updateWordStateStructure(states, key, increment) {
    if (!states) {
      states = {}
    }
    if (!states[key]) {
      states[key] = 0;
    }
    states[key] += increment
    return states;
  }

  updateWordState(word, increment) {
    var key = word.state

    this.setState((s) => {
      var states = {
        ...s.card_states
      };
      states = CardApp.updateWordStateStructure(states, key, increment);

      return {card_states: states}
    })
  }

  setCard(grade) {
    // If there is no current word, don't do anything
    var word = this.getCurrentWord();
    if (!word) {
      return;
    }

    var newcards = this.state.cards.slice();

    // Make an entire copy of the state
    var oldstate = {
      ...this.state
    }
    this.undo_stack.push(oldstate);
    while (this.undo_stack.length > 10) {
      this.undo_stack.shift();
    }

    // Remove this word from the array (It must exist)
    newcards.splice(newcards.indexOf(word), 1);

    this.updateWordState(word, -1);

    var oldcard = word.card;
    word = word.nextDate(grade)
    // Update the card field
    word.card = oldcard;

    this.updateWordState(word, 1)

    if (word.state !== this.terminal_state) {
      // Re-insert this randomly in the deck
      /**
      * Returns a random integer between min (inclusive) and max (inclusive)
      * Using Math.round() will give you a non-uniform distribution!
      */
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      var index = getRandomInt(0, newcards.length);
      newcards.splice(index, 0, word);
    } else {
      // We just drop the card, we are done with it
      //console.log("DONE WITH CARD")
    }

    this.setState(() => ({cards: newcards, front_or_back: this.starting_state()}))

    return word;
  }

  notify(signal, data) {
    if (this.props[signal]) {
      this.props[signal](data);
    }
  }

  bad = () => {
    var word = this.setCard('bad');
    this.notify('onBad', word.card);
  }

  undo = () => {
    var oldstate = this.undo_stack.pop();
    if (oldstate) {
      this.setState(oldstate);
    }
  }

  handleKeyPress = (e) => {

    if (e.key === 'f') {
      this.flip();
    } else if (e.key === ' ') {
      this.flip();
    } else if (e.key === 'Enter') {
      this.next();
    } else if (e.key === 'n') {
      this.next();
    } else if (e.key === 'b') {
      this.bad();
    } else if (e.key === 'u') {
      this.undo();
    }

  }

  gamePadConnected = (e) => {
    if (this.reading_game_pad) {
      return;
    }

    this.readGamePad();
  }

  readGamePad = () => {
    this.reading_game_pad = null;

    var gamepads = navigator.getGamepads
      ? navigator.getGamepads()
      : (
        navigator.webkitGetGamepads
        ? navigator.webkitGetGamepads
        : []);
    var buttons = [];
    for (var i = 0; i < gamepads.length; i++) {
      var gp = gamepads[i];
      if (gp && gp.connected && gp.buttons.length > 0) {
        buttons = gp.buttons.map(b => b.pressed);
      }
    }
    if (this.lastbuttons) {
      var changed = false;
      buttons.forEach((b, i) => {
        if (this.lastbuttons[i] !== b) {
          this.buttonChanged(i, b);
          changed = true;
        }
      })
      if (changed) {
        this.setState({buttons: buttons})
      }
    }
    this.lastbuttons = buttons;
    // If the length of the buttons is 0, then we didn't find any
    // gamepads, so it must have been disconnected.
    if (buttons.length !== 0) {
      this.reading_game_pad = requestAnimationFrame(this.readGamePad);
    }
  }

  buttonChanged(index, isPressed) {
    if (isPressed === false) {
      return;
    }
    if (index === 1) {
      this.flip();
    } else if (index === 0) {
      this.next();
    } else if (index === 3) {
      this.bad();
    } else if (index === 2) {
      this.undo();
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress, false)
    window.addEventListener("gamepadconnected", this.gamePadConnected);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
  }

  render() {
    var card = this.getCurrentCard();

    var color = 'white';
    if (this.state.card_states[this.end_state] === this.state.cards.length) {
      color = 'green';
    }

    return (<div style={{
        backgroundColor: color
      }}>
      <div className='cardstats'>
        {
          ['bad', 'new', 'average'].map((t) => {
            return (<div key={t} className={t}>{this.state.card_states[t] || 0}</div>)
          })
        }
      </div>
      <div className="controls btn-group" role='group'>
        <button className='btn btn-default' onClick={this.flip}>Flip</button>
        <button className='btn btn-default' onClick={this.shuffle}>Shuffle</button>
        <button className='btn btn-default' onClick={this.undo}>Undo</button>
        <button className='btn btn-default' onClick={this.bad}>Bad</button>
        <button className='btn btn-default' onClick={this.next}>Good</button>
      </div>
      <div className="cardframe">
        <Card card={card} side={this.state.front_or_back}></Card>
      </div>

    </div>);
  }
}

export default App;
