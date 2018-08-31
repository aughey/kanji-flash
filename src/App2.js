// class App2 extends Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       from_index: 1,
//       to_index: 20
//     }
//
//     try {
//       var obj = JSON.parse(localStorage.getItem("INDICES"))
//       this.state.from_index = obj.from_index
//       this.state.to_index = obj.to_index
//     } catch (e) {
//       console.log(e)
//     }
//
//     try {
//       var badwords = JSON.parse(localStorage.getItem("BADWORDS"))
//       this.state.badwords = badwords;
//     } catch (e) {}
//
//     if (!this.state.badwords) {
//       this.state.badwords = [];
//     }
//   }
//   options = () => {
//     this.setState({
//       options: !this.state.options
//     })
//   }
//   set = (key, value) => {
//     var obj = {}
//     obj[key] = value;
//     this.setState(obj);
//   }
//
//   saveBadWords(words) {
//     try {
//       localStorage.setItem("BADWORDS", JSON.stringify(words));
//     } catch (e) {}
//   }
//
//   onBad = (word) => {
//     this.setState((s) => {
//       if (-1 === s.badwords.findIndex((w) => w.front.text === word.front.text)) {
//         var newwords = s.badwords.slice();
//         newwords.push(word);
//         this.saveBadWords(newwords);
//         return {badwords: newwords}
//       } else {
//         return null
//       }
//     })
//   }
//
//   removeAllBad = () => {
//     this.setState({badwords: []})
//   }
//
//   removeBad = (word) => {
//     this.setState((s) => {
//       var newwords = s.badwords.slice();
//       newwords.splice(newwords.indexOf(word), 1);
//       this.saveBadWords(newwords);
//       return {badwords: newwords}
//
//     })
//   }
//
//   showBadWords = () => {
//     this.setState((s) => ({
//       show_badwords: !s.show_badwords
//     }))
//   }
//
//   render() {
//
//     function getNumber(v) {
//       v = parseInt(v, 10);
//       if (!v) {
//         v = 0;
//       }
//       return v;
//     }
//
//     var from = getNumber(this.state.from_index);
//     var to = getNumber(this.state.to_index);
//
//     if (localStorage) {
//       var to_store = {
//         from_index: from,
//         to_index: to
//       }
//       localStorage.setItem("INDICES", JSON.stringify(to_store));
//     }
//
//     var app_to_show;
//     if (this.state.show_badwords) {
//       app_to_show = (<BadWords badwords={this.state.badwords} onRemoveWord={this.removeBad} onRemoveAll={this.removeAllBad}/>)
//     } else if (this.state.options) {
//       app_to_show = (<div>
//         <div className="range">
//           Show cards from RTK index
//           <input value={this.state.from_index} onChange={e => this.set('from_index', e.target.value)}/>
//           to
//           <input value={this.state.to_index} onChange={e => this.set('to_index', e.target.value)}/>
//         </div>
//       </div>)
//     } else {
//       app_to_show = (<CardApp starting_state='back' from_index={from} to_index={to} onBad={this.onBad}/>)
//     }
//
//     return (<div className="App">
//       <div className="btn-group" role='group'>
//         <button className='btn btn-default' onClick={this.options}>Options</button>
//         <button className='btn btn-default' onClick={this.showBadWords}>Bad Words</button>
//       </div>
//       {app_to_show}
//     </div>);
//   }
// }



// 
// class CardApp extends Component {
//   constructor(props) {
//     super(props);
//     this.terminal_state = 'average'
//     this.state = {
//       front_or_back: this.starting_state(),
//       cards: []
//     };
//     this.undo_stack = [];
//   }
//
//   starting_state() {
//     return this.props.starting_state
//   }
//
//   static getCardStates(cards) {
//     var states = {}
//     cards.forEach((c) => CardApp.updateWordStateStructure(states, c.state, 1))
//     return states;
//   }
//
//   static getDerivedStateFromProps(props, state) {
//     if (props.from_index !== state.from_index || props.to_index !== state.to_index) {
//       return CardApp.getShuffledCardsState(props.from_index, props.to_index)
//     } else {
//       return null;
//     }
//   }
//
//   static getShuffledCardsState(begin, end) {
//     // Make a copy
//     var cards = [];
//     const last_shown = new Date()
//     const last_state = 'new'
//     for (var i = begin; i <= end; ++i) {
//       var card = KanjiData[i];
//       if (!card) {
//         //console.log("Missing Card index: " + i)
//       } else {
//         cards.push(card)
//       }
//     }
//
//     shuffleArray(cards);
//
//     // Transform the cards to SpacedRepetition words
//     cards = cards.map((card) => {
//       const word = new SpacedRepetition(last_shown, last_state, sr_config)
//       word.card = card;
//       return word;
//     })
//
//     return {cards: cards, from_index: begin, to_index: end, card_states: CardApp.getCardStates(cards), front_or_back: 'back'}
//   }
//
//   shuffle = () => {
//     this.undo_stack = [];
//     var shuffled_state = CardApp.getShuffledCardsState(this.state.from_index, this.state.to_index)
//     shuffled_state.front_or_back = this.starting_state()
//     this.setState(() => shuffled_state)
//   }
//
//   flip = () => {
//     this.setState(() => ({
//       front_or_back: this.state.front_or_back === 'front'
//         ? "back"
//         : 'front'
//     }))
//   }
//
//   next = () => {
//     this.setCard('good');
//   }
//
//   getCurrentWord() {
//     //var cards = this.state.cards
//
//     return this.state.cards[0];
//     // for (var i = 0; i < cards.length; ++i) {
//     //   var card = cards[i]
//     //     return card;
//     //   }
//     // }
//     // return null;
//     //return cards[0];
//   }
//
//   getCurrentCard() {
//     var word = this.getCurrentWord();
//     if (word) {
//       return word.card
//     } else {
//       return {
//         front: {
//           text: "NO CARDS"
//         },
//         back: {
//           text: "NO CARDS"
//         }
//       };
//     }
//   }
//
//   static updateWordStateStructure(states, key, increment) {
//     if (!states) {
//       states = {}
//     }
//     if (!states[key]) {
//       states[key] = 0;
//     }
//     states[key] += increment
//     return states;
//   }
//
//   updateWordState(word, increment) {
//     var key = word.state
//
//     this.setState((s) => {
//       var states = {
//         ...s.card_states
//       };
//       states = CardApp.updateWordStateStructure(states, key, increment);
//
//       return {card_states: states}
//     })
//   }
//
//   setCard(grade) {
//     // If there is no current word, don't do anything
//     var word = this.getCurrentWord();
//     if (!word) {
//       return;
//     }
//
//     var newcards = this.state.cards.slice();
//
//     // Make an entire copy of the state
//     var oldstate = {
//       ...this.state
//     }
//     this.undo_stack.push(oldstate);
//     while (this.undo_stack.length > 10) {
//       this.undo_stack.shift();
//     }
//
//     // Remove this word from the array (It must exist)
//     newcards.splice(newcards.indexOf(word), 1);
//
//     this.updateWordState(word, -1);
//
//     var oldcard = word.card;
//     word = word.nextDate(grade)
//     // Update the card field
//     word.card = oldcard;
//
//     this.updateWordState(word, 1)
//
//     if (word.state !== this.terminal_state) {
//       // Re-insert this randomly in the deck
//       /**
//       * Returns a random integer between min (inclusive) and max (inclusive)
//       * Using Math.round() will give you a non-uniform distribution!
//       */
//       function getRandomInt(min, max) {
//         return Math.floor(Math.random() * (max - min + 1)) + min;
//       }
//       var index = getRandomInt(0, newcards.length);
//       newcards.splice(index, 0, word);
//     } else {
//       // We just drop the card, we are done with it
//       //console.log("DONE WITH CARD")
//     }
//
//     this.setState(() => ({cards: newcards, front_or_back: this.starting_state()}))
//
//     return word;
//   }
//
//   notify(signal, data) {
//     if (this.props[signal]) {
//       this.props[signal](data);
//     }
//   }
//
//   bad = () => {
//     var word = this.setCard('bad');
//     this.notify('onBad', word.card);
//   }
//
//   undo = () => {
//     var oldstate = this.undo_stack.pop();
//     if (oldstate) {
//       this.setState(oldstate);
//     }
//   }
//
//   handleKeyPress = (e) => {
//
//     if (e.key === 'f') {
//       this.flip();
//     } else if (e.key === ' ') {
//       this.flip();
//     } else if (e.key === 'Enter') {
//       this.next();
//     } else if (e.key === 'n') {
//       this.next();
//     } else if (e.key === 'b') {
//       this.bad();
//     } else if (e.key === 'u') {
//       this.undo();
//     }
//
//   }
//
//   gamePadConnected = (e) => {
//     if (this.reading_game_pad) {
//       return;
//     }
//
//     this.readGamePad();
//   }
//
//   readGamePad = () => {
//     this.reading_game_pad = null;
//
//     var gamepads = navigator.getGamepads
//       ? navigator.getGamepads()
//       : (
//         navigator.webkitGetGamepads
//         ? navigator.webkitGetGamepads
//         : []);
//     var buttons = [];
//     for (var i = 0; i < gamepads.length; i++) {
//       var gp = gamepads[i];
//       if (gp && gp.connected && gp.buttons.length > 0) {
//         buttons = gp.buttons.map(b => b.pressed);
//       }
//     }
//     if (this.lastbuttons) {
//       var changed = false;
//       buttons.forEach((b, i) => {
//         if (this.lastbuttons[i] !== b) {
//           this.buttonChanged(i, b);
//           changed = true;
//         }
//       })
//       if (changed) {
//         this.setState({buttons: buttons})
//       }
//     }
//     this.lastbuttons = buttons;
//     // If the length of the buttons is 0, then we didn't find any
//     // gamepads, so it must have been disconnected.
//     if (buttons.length !== 0) {
//       this.reading_game_pad = requestAnimationFrame(this.readGamePad);
//     }
//   }
//
//   buttonChanged(index, isPressed) {
//     if (isPressed === false) {
//       return;
//     }
//     if (index === 1) {
//       this.flip();
//     } else if (index === 0) {
//       this.next();
//     } else if (index === 3) {
//       this.bad();
//     } else if (index === 2) {
//       this.undo();
//     }
//   }
//
//   componentDidMount() {
//     document.addEventListener('keydown', this.handleKeyPress, false)
//     window.addEventListener("gamepadconnected", this.gamePadConnected);
//   }
//
//   componentWillUnmount() {
//     document.removeEventListener('keydown', this.handleKeyPress);
//   }
//
//   render() {
//     var card = this.getCurrentCard();
//
//     var color = 'white';
//     if (this.state.card_states[this.end_state] === this.state.cards.length) {
//       color = 'green';
//     }
//
//     return (<div style={{
//         backgroundColor: color
//       }}>
//       <div className='cardstats'>
//         {
//           ['bad', 'new', 'average'].map((t) => {
//             return (<div key={t} className={t}>{this.state.card_states[t] || 0}</div>)
//           })
//         }
//       </div>
//       <div className="controls btn-group" role='group'>
//         <button className='btn btn-default' onClick={this.flip}>Flip</button>
//         <button className='btn btn-default' onClick={this.shuffle}>Shuffle</button>
//         <button className='btn btn-default' onClick={this.undo}>Undo</button>
//         <button className='btn btn-default' onClick={this.bad}>Bad</button>
//         <button className='btn btn-default' onClick={this.next}>Good</button>
//       </div>
//       <div className="cardframe">
//         <Card card={card} side={this.state.front_or_back}></Card>
//       </div>
//
//     </div>);
//   }
// }
