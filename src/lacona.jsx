import _ from 'lodash'
import React from 'react'

import LaconaOptions from './options'
import LaconaInput from './input'

function bound (number, max) {
  return Math.max(Math.min(number, max - 1), 0)
}

export default class LaconaView extends React.Component {
  constructor (props) {
    super(props)

    this.setByMouse = false

    this.blurMatters = true

    const hasOutputs = props.length > 0
    this.state = {selection: hasOutputs ? 0 : -1}
  }

  componentWillReceiveProps (nextProps) {
    const hasOutputs = nextProps.outputs.length > 0
    this.setState({selection: hasOutputs ? 0 : -1})
  }

  componentDidMount () {
    this.componentDidUpdate()
  }

  componentDidUpdate () {
    if (this.state.selection > -1 && !this.setByMouse) {
      const options = React.findDOMNode(this.refs.options)
      const optionsRect = options.getBoundingClientRect()
      const optionReact = this.refs.options.getOption(this.state.selection)
      if (optionReact) {
        const selectedRect = React.findDOMNode(optionReact).getBoundingClientRect()
        if (selectedRect.top < optionsRect.top) {
          options.scrollTop -= (optionsRect.top - selectedRect.top)
        } else if (selectedRect.bottom > optionsRect.bottom) {
          options.scrollTop += (selectedRect.bottom - optionsRect.bottom)
        }
      }
    }
    this.props.change()
  }

  completeSelection (index = this.state.selection) {
    if (index > -1) {
      const result = this.props.outputs[index]
      const newString = _.chain(result.words)
        .takeWhile(item => !item.placeholder)
        .map('text')
        .join('')
        .value()

      this.props.clearPrefix()

      this.update(newString)
    }
  }

  moveSelection (steps) {
    this.setByMouse = false
    const selection = bound(this.state.selection + steps, this.props.outputs.length)
    this.setState({selection})
  }

  execute (index = this.state.selection) {
    if (index > -1) {
      const result = this.props.outputs[index]
      if (!result) return

      if (_.some(result.words, 'placeholder')) {
        this.completeSelection(index)
        this.refs.input.focusEnd()
      } else {
        this.update('')
        this.setState({showHints: false})
        this.props.onBlur()
        this.props.execute(index)
      }
    }
  }

  select (index) {
    this.setByMouse = true
    const selection = bound(index, this.props.outputs.length)
    this.setState({selection})
  }

  cancel () {
    this.props.cancel()
  }

  update (newText) {
    this.props.update(newText)
  }

  focusEnd () {
    this.refs.input.focusEnd()
  }

  onFocus (event) {
    this.setState({showHints: true})
    this.props.onFocus(event)
  }

  onBlur (event) {
    if (!this.blurMatters) return
    this.setState({showHints: false})
    this.props.onBlur(event)
  }

  mouseDown () {
    this.blurMatters = false
    this.props.userInteracted()
  }

  mouseUp () {
    this.blurMatters = true
  }

  blur () {
    this.refs.input.blur()
  }

  render () {
    return (
      <div className='lacona-view'>
        <LaconaInput
          ref='input'
          update={this.update.bind(this)}
          prefix={this.props.prefix}
          suffix={this.props.suffix}
          tabIndex={this.props.tabIndex}
          completeSelection={this.completeSelection.bind(this)}
          moveSelection={this.moveSelection.bind(this)}
          userInput={this.props.userInput}
          execute={this.execute.bind(this)}
          cancel={this.cancel.bind(this)}
          onFocus={this.onFocus.bind(this)}
          onBlur={this.onBlur.bind(this)}
          userInteracted={this.props.userInteracted}
          placeholder={this.props.placeholder} />
        <LaconaOptions
          ref='options'
          outputs={this.props.outputs}
          selection={this.state.selection}
          execute={this.execute.bind(this)}
          select={this.select.bind(this)}
          showHints={this.state.showHints}
          onMouseDown={this.mouseDown.bind(this)}
          onMouseUp={this.mouseUp.bind(this)} />
      </div>
    )
  }
}

LaconaView.defaultProps = {
  outputs: [],
  update: function () {},
  cancel: function () {},
  change: function () {},
  execute: function () {},
  select: function () {},
  onFocus: function () {},
  onBlur: function () {},
  userInteracted: function () {},
  clearPrefix: function () {}
}
