const action = app.create('action')
action.label = 'working?'
action.onTrigger = () => {
  console.log('working?')
}