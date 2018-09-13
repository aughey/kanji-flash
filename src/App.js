import React, {Component} from 'react';
import './App.css';
import OrigKanjiData from './kanji.json'
import Button from '@material-ui/core/Button';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import CssBaseline from '@material-ui/core/CssBaseline';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import {isEqual} from 'lodash';

function GetStore(key, dflt) {
  try {
    var obj = JSON.parse(localStorage.getItem(key))
    //console.log(obj);
    if(!obj) {
      return dflt;
    }
    return obj;
  } catch (e) {
    return dflt;
  }
}

function WriteStore(key, obj) {
  try {
  //  console.log(obj);
    return localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    return null;
  }
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

class StudyOptions extends Component {
  constructor(props) {
    super(props);
    this.state = {...props}

  }
  render() {
    var toggle = (p) => {
      return() => {
        this.setState((s) => ({
          [p]: !s[p]
        }))
      }
    }

    var handleChange = name => event => {
      this.setState({[name]: event.target.value});
    };

    var frontBackChange = (e) => {
      this.setState({starting_state: e.target.value})
    }

    return (<div>
      <h1>Study Paramters</h1>
      <TextField id="from" label="Starting Index" value={this.state.from} onChange={handleChange('from')} margin="normal"/>
      <br/>

      <TextField id="to" label="Ending Index" value={this.state.to} onChange={handleChange('to')} margin="normal"/>
      <br/>
      <FormControl>
        <FormLabel component="legend">Card side to show first</FormLabel>
        <RadioGroup value={this.state.starting_state} onChange={frontBackChange}>
          <FormControlLabel value="front" control={<Radio />} label="Front" labelPlacement="start"/>
          <FormControlLabel value="back" control={<Radio />} label="Back" labelPlacement="start"/>
        </RadioGroup>
      </FormControl>

      <br/>
      <FormControlLabel control={<Checkbox checked = {
          this.state.shuffle
        }
        onClick = {
          toggle('shuffle')
        } />} label="Shuffle"/>
      <br/>
      <Button onClick={() => {
          this.props.onStudy(this.state)
        }} variant="contained" size='large'>STUDY</Button>
      <Button onClick={() => {
          this.props.showKanji(this.state)
        }} variant="contained" size='large'>Show Kanji</Button>
    </div>);
  }
}

class StartPage extends Component {
  render() {
    return (<div>
      <h1>Kanji Flashcards</h1>
      <Button onClick={this.props.onStudy} variant="contained" size='large'>
        Study
      </Button>
    </div>)
  }
}

class StudyCards extends Component {
  constructor(props) {
    super(props);
    this.terminal_state = 'average'
    this.state = {
      front_or_back: props.starting_state,
      cards: props.cards
    };
    this.undo_stack = [];
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.cards !== this.props.cards) {
      this.setState({cards: nextProps.cards})
    }
  }

  log = (m) => {
    this.props.log(m);
  }

  flip = () => {
    this.setState((s) => {
      return {
        front_or_back: s.front_or_back === 'front'
          ? "back"
          : 'front'
      }
    });
  }

  currentCard() {
    return this.state.cards[0];
  }

  setCard(s) {
    var card = this.currentCard();
    if (!card) {
      return;
    }

    // Make an entire copy of the state and save it on the undo stack
    var oldstate = {
      ...this.state
    }
    // We force the front_or_back of the old state to be the starting_state
    oldstate.front_or_back = this.props.starting_state;
    this.undo_stack.push(oldstate);
    while (this.undo_stack.length > 10) {
      this.undo_stack.shift();
    }

    var count = s.show_count;

    if (s === 'bad') {
      count = 2;
    } else {
      count -= 1;
    }

    // Remove the card
    var newcards = this.state.cards.filter((c) => c !== card);
    if (count > 0) {
      // Re-insert this randomly in the deck
      /**
      * Returns a random integer between min (inclusive) and max (inclusive)
      * Using Math.round() will give you a non-uniform distribution!
      */
      function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
      var index = getRandomInt(Math.floor(newcards.length / 2), newcards.length);

      // Make a copy
      card = {
        ...card
      }
      card.show_count = count;

      newcards.splice(index, 0, card);
    }

    this.setState(() => ({cards: newcards, front_or_back: this.props.starting_state}));
  }

  good = () => {
    this.setCard('good');
  }

  bad = () => {
    this.setCard('bad');
  }

  undo = () => {
    var oldstate = this.undo_stack.pop();
    if (oldstate) {
      this.setState(oldstate);
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyPress, false)
    window.addEventListener("gamepadconnected", this.gamePadConnected);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyPress);
    window.removeEventListener("gamepadconnected", this.gamePadConnected);

    if (this.reading_game_pad) {
      cancelAnimationFrame(this.reading_game_pad);
      this.reading_game_pad = null;
    }
  }

  handleKeyPress = (e) => {

    if (e.key === 'f') {
      this.flip();
    } else if (e.key === ' ') {
      this.flip();
    } else if (e.key === 'Enter') {
      this.good();
    } else if (e.key === 'g' || e.key === 'y') {
      this.good();
    } else if (e.key === 'b' || e.key === 'n') {
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
      this.good();
    } else if (index === 3) {
      this.bad();
    } else if (index === 2) {
      this.undo();
    }
  }

  render() {
    var card = this.currentCard();

    if (!card) {
      return (<div>
        <h1>NO CARDS</h1>
      </div>)
    }
    //console.log(card);

    var text = card[this.state.front_or_back].text;
    var text2 = null;

    if(this.state.front_or_back !== this.props.starting_state) {
      text2 = card[this.props.starting_state].text;
    }

    return (<div>
      <div className="controls btn-group" role='group'>
        <Button onClick={this.flip}>Flip</Button>
        <Button onClick={this.undo}>Undo</Button>
        <Button onClick={this.bad}>Bad</Button>
        <Button onClick={this.good}>Good</Button>
      </div>
      <div>
        {this.state.cards.length}</div>
      <div className="cardframe">
        <Card log={this.log} text={text} text2={text2} lang={card.lang}></Card>
      </div>
    </div>);
  }
}

class Card extends Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.scale = 1.0;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return !isEqual(nextProps, this.props) || !isEqual(nextState, this.state);
  }

  log(m) {
    this.props.log(m);
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
    if (!el) {
      return;
    }
    var pos = getElPosition(el);
    var rect = el.getBoundingClientRect();
    var window_size = {
      width: window.innerWidth - 40, // padding
      height: window.innerHeight - pos.y
    }
    var element_size = {
      width: rect.width / this.scale,
      height: rect.height / this.scale
    }

    var windowratio = window_size.width / window_size.height;
    var elratio = element_size.width / element_size.height;
    var scalekey;
    if (windowratio < elratio) {
      scalekey = 'width';
    } else {
      scalekey = 'height';
    }
    //var base_font_size = 50; sizes.base_font_size;
    //base_font_size = parseFloat(base_font_size)
    //var base_font_size = this.fontsize;
    var font_scale = (window_size[scalekey] / element_size[scalekey])

    this.log("Font_scale: " + font_scale);

    this.setScale(font_scale, 'visible');

    // this.setState({
    //   sizes: {
    //     render_text: this.render_text,
    //     base_font_size: base_font_size,
    //     window_size: {
    //       width: window.innerWidth - 40,  20 px for padding
    //       height: window.innerHeight - pos.y
    //     },
    //     element_size: {
    //       width: rect.width / this.scale,
    //       height: rect.height / this.scale
    //     }
    //   }
    // });
  }

  setScale(s, visibility) {
    var el = this.ref.current;
    if (el) {
      el.style.transform = "scale(" + s + ")"
      el.style.transformOrigin = '50% 0 0'
      el.style.visibility = visibility;
      this.scale = s
    }
  }

  render() {
    this.setScale(1.0, 'hidden');

    window.requestAnimationFrame(this.updateWindowDimensions);
    //    <button onClick={() => {window.requestAnimationFrame(this.updateWindowDimensions)}}>r</button>

    var t2 = null;
    if(this.props.text2) {
      t2 = (<div>{this.props.text2}</div>)
    }

    return (<div ref={this.ref} className={'card card-' + this.props.lang}>
      <div className="card-text"><div>{this.props.text}</div>{t2}</div>
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

class ShowKanji extends Component {
  render() {
    return (<textarea>
      {
        this.props.cards.map((c) => {
          return c.front.text
        }).join('')
      }
    </textarea>);
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: "splash",
      logMessages: []
    }
    this.statestack = [];
  }

  log = (message) => {
    //console.log(message)
    this.setState((s) => {
      var logs = s.logMessages.slice()
      logs.unshift(message);
      return {logMessages: logs}
    })
  }

  back = () => {
    var newstate = this.statestack.pop();
    this.setState({screen: newstate})
  }

  showKanji = (p) => {
    var cards = this.createCards(p);
    this.starting_state = p.starting_state
    this.cards = cards;

    this.pushState('kanji');
  }

  createCards(p) {
    var begin = parseInt(p.from, 10);
    var end = parseInt(p.to, 10);
    // Make a copy
    var cards = [];
    for (var i = begin; i <= end; ++i) {
      var card = KanjiData[i];
      if (!card) {
        //console.log("Missing Card index: " + i)
      } else {
        card.show_count = 1;
        cards.push(card)
      }
    }

    if(p.shuffle) {
    shuffleArray(cards);
  }

    return cards;
  }

  createStudy = (p) => {
    var cards = this.createCards(p);
    this.starting_state = p.starting_state
    this.cards = cards;

    WriteStore("studyoptions",p);

    this.pushState('study');
  }

  pushState(s) {
    this.setState((oldstate) => {
      this.statestack.push(oldstate.screen);
      return {screen: s}
    })
  }

  render() {
    var doPushState = (s) => {
      return() => {
        this.pushState(s);
      }
    }

    var content;
    switch (this.state.screen) {
      case "splash":
        content = (<StartPage onStudy={doPushState('studyoptions')}/>);
        break;
      case 'studyoptions':
        var p = GetStore("studyoptions",{
          from: 10,
          to: 100,
          shuffle: true,
          starting_state: 'back'
        });
        //console.log(p);

        content = (<StudyOptions {...p} showKanji={this.showKanji} onStudy={this.createStudy}/>);
        break;
      case 'study':
        content = (<StudyCards log={this.log} starting_state={this.starting_state} cards={this.cards}/>);
        break;
      case 'kanji':
        content = (<ShowKanji cards={this.cards}/>);
        break;
      default:
        content = (<div>UNKNOWN STATE: {this.state.screen}</div>)
    }

    // var log = (<div style={({
    //     position: 'absolute',
    //     left: 0,
    //     bottom: 0,
    //     width: '100%',
    //     height: '20%',
    //     overflow: 'scroll',
    //     backgroundColor: 'green'
    //   })}>
    //   <ul>
    //     {this.state.logMessages.map((m, i) => (<li key={i}>{m}</li>))}
    //   </ul>
    // </div>);

    return (<div className='App'>
      <CssBaseline/>
      <AppBar position="static" color="default">
        <Toolbar>
          {
            this.statestack.length > 0
              ? (<Button onClick={this.back}>Back</Button>)
              : null
          }
        </Toolbar>
      </AppBar>
      {content}

    </div>)
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

export default App;
