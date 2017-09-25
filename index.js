import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import classNames from 'classnames'
import style from './Dropdown.scss'



//Scroll bug fix for now
const SCROLL_TOP_POSITION = 50;
const DEFAULT_PLACEHOLDER_STRING = ''

/**
 * Dropdown - Simple component with key support
 * @class Dropdown
 * @extends {Component}
 * Use Case - It can be used with forms and as individual component
 * Required props - value, options, id
 * optional props - placeholder, baseClassName
 * supported data format = ['a', 'b', 'c'] or [{key : 'a', value : 'a'}]
 */
class Dropdown extends Component {
  constructor(props) {
    super(props)

    // Get the list and change it to key value object since 
    // option can be passed as ['a', 'b', 'c'] or [{key : 'a', value : 'a'}]
    this.optionList = [];
    if (props.options.length) {
      this.optionList = this.listFormatter(props.options)
    }
    let defaultValue = {
      value: props.placeholder || DEFAULT_PLACEHOLDER_STRING,
      key: ''
    }
    // if value is passed then make that as a selected value
    if (props.value && this.optionList.length) {
      defaultValue = this.optionList.find(f => f.key == props.value)
    }

    this.state = {
      selected: defaultValue,
      isOpen: false,
      options: this.optionList,
      currentSelected: defaultValue,
      focusedElement: null,
      changeFocus: false
    }
    this.mounted = true
    this.handleDocumentClick = this.handleDocumentClick.bind(this)
    this.fireChangeEvent = this.fireChangeEvent.bind(this)

  }

  listFormatter(options) {
    if (typeof options[0] === 'string') {
      let newList = [];
      options.map(o => newList.push({ key: o, value: o }))
      return newList;
    } else {
      return options;
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.options.length !== newProps.options.length) {
      if (newProps.options.length > 0) {
        let list = this.listFormatter(newProps.options)
        this.setState({ options: list })
      }
    }
    if ((newProps.value !== this.state.selected.key)) {
      let selectedData = this.state.options.find(f => f.key == newProps.value);
      if (selectedData) {
        this.setState({ selected: selectedData });
      } else {
        this.setState({ selected: { key: '', value: '' } });
      }
    } else if (!newProps.value) {
      this.setState({
        selected: {
          value: newProps.placeholder || DEFAULT_PLACEHOLDER_STRING,
          key: ''
        }
      })
    }
  }

  componentDidMount() {
    document.addEventListener('click', this.handleDocumentClick, false)
    document.addEventListener('touchend', this.handleDocumentClick, false)
  }

  componentWillUnmount() {
    this.mounted = false
    document.removeEventListener('click', this.handleDocumentClick, false)
    document.removeEventListener('touchend', this.handleDocumentClick, false)
  }

  handleMouseDown(event) {
    if (!this.props.disabled) {
      this.setState({
        isOpen: !this.state.isOpen
      })
    }
  }

  setActiveItem(self) {
    if (self.refs[self.state.selected.key]) {
      self.refs[self.state.selected.key].focus();
      console.log('focused on', self.state.selected.key);
      self.refs.menuConatiner.scrollTop = self.refs[self.state.selected.key].offsetTop;
    }
  }

 // Supporting key events eg : 'Enter', 'ArrowDown', 'ArrowUp', 'Escape'
  handleKeyDown(currentRef, event) {
    console.log(event, currentRef);
    this.setState({ changeFocus: false });
    switch (event.key) {
      case 'Enter': {
        if (this.state.focusedElement) {
          this.setValue(this.state.focusedElement.key, this.state.focusedElement.value);
        }
        return
      }
      case 'ArrowDown': {
        if (!this.state.isOpen) {
          this.setState({ isOpen: true });
        }
        this.setState({ changeFocus: true });
        this.focusNext(this, currentRef, 'down');
        return;
      }
      case 'ArrowUp': {
        this.setState({ changeFocus: true });
        this.focusNext(this, currentRef, 'up');
        return
      }
      case 'Escape': {
        this.state.currentSelected ?
          this.setState({ isOpen: false, selected: this.state.currentSelected }) :
          this.setState({ isOpen: false });
        return
      }
      default: {
        const re = new RegExp('^' + event.key, 'i')
        const match = this.state.options.find(o => re.test(o.key))
        if (match) this.setState({ selected: { value: match.value, key: match.key } });
      }
    }

  }

  componentDidUpdate() {
    if (this.state.isOpen && !this.state.changeFocus) {
      this.setActiveItem(this);
    }
  }

  focusDropDown() {
    if (this.refs[this.props.id]) {
      ReactDOM.findDOMNode(this.refs[this.props.id]).focus();
    }
  }

  focusNext(self, currentRef, direction) {
    let domElementItem = ReactDOM.findDOMNode(self.refs[currentRef]);
    console.log(domElementItem);
    let nextElement;
    if (direction === 'down') {
      if (domElementItem.nextElementSibling) {
        nextElement = domElementItem.nextElementSibling;
      }
    } else if (direction === 'up') {
      nextElement = domElementItem.previousElementSibling;
    }
    if (nextElement) {
      this.setState({ focusedElement: { key: nextElement.id, value: nextElement.textContent } })
      nextElement.focus();
      self.refs.menuConatiner.scrollTop = nextElement.offsetTop - SCROLL_TOP_POSITION;
    }
    return;
  }

  setValue(key, value) {
    this.setState({
      currentSelected: { key, value },
      selected: { key, value },
      isOpen: false,
      changeFocus: false
    })
    this.fireChangeEvent({ key, value });
  }

  fireChangeEvent(newState) {
    if (newState.key !== this.state.selected.key && this.props.onChange) {
      this.props.onChange(newState)
    }
  }
  
  // Menu creation and formation
  renderOption(option) {
    let optionClass = classNames({
      [`${this.props.baseClassName}-option`]: true,
      'is-selected': option.key === this.state.selected.key
    })
    let key = option.key
    let value = option.value

    return (
      <div
        tabIndex={0}
        ref={option.key}
        key={key}
        id={key}
        className={optionClass}
        onMouseDown={this.setValue.bind(this, key, value)}
        onClick={this.setValue.bind(this, key, value)}
        onKeyDown={this.handleKeyDown.bind(this, option.key)}>
        <span>{value}</span>
      </div>
    )
  }

  buildMenu() {
    let { baseClassName } = this.props
    let options = this.state.options
    let ops = options.map((option) => {
      // if (option.type === 'group') {
      //   let groupTitle = (<div className={`${baseClassName}-title`}>{option.name}</div>)
      //   let _options = option.items.map((item) => this.renderOption(item))

      //   return (
      //     <div className={`${baseClassName}-group`} key={option.name}>
      //       {groupTitle}
      //       {_options}
      //     </div>
      //   )
      // } else {
      return this.renderOption(option)
      //}
    })

    return ops.length ? ops : <div className={`${baseClassName}-noresults`}><span>No options found</span></div>
  }

  handleDocumentClick(event) {
    if (this.mounted) {
      if (!ReactDOM.findDOMNode(this).contains(event.target)) {
        this.setState({ isOpen: false })
      }
      this.setState({ selected: this.state.currentSelected });
    }
  }

  handleBlur() {
    if (this.props.handleBlur) {
      this.props.handleBlur(true);
    }
  }

  render() {
    const { baseClassName, className, id, customMenuClass } = this.props

    const disabledClass = this.props.disabled ? 'Dropdown-disabled' : ''
    const placeHolderValue = this.state.selected.value;
    let value = (<div className={`${baseClassName}-placeholder`}>{placeHolderValue}</div>)
    let menu = this.state.isOpen ? <div ref="menuConatiner" id={`${id}-m`} className={`${baseClassName}-menu ${customMenuClass}`}>{this.buildMenu()}</div> : null

    let dropdownClass = classNames({
      [className]: true,
      [`${baseClassName}-root`]: true,
      'is-open': this.state.isOpen
    })

    return (
      <div className={dropdownClass}>
        <div className={`${baseClassName}-control ${disabledClass}`} id={`${id}-p`}
          tabIndex="0"
          ref={id}
          onKeyDown={this.handleKeyDown.bind(this, id)}
          onMouseDown={this.handleMouseDown.bind(this)}
          onTouchEnd={this.handleMouseDown.bind(this)}
          onBlur={this.handleBlur.bind(this)}
        >
          {value}
          <span className={`${baseClassName}-arrow`} />
        </div>
        {menu}
      </div>
    )
  }
}

Dropdown.defaultProps = { baseClassName: 'Dropdown' }
export default Dropdown