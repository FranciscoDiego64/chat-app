import React from 'react';
import { View, StyleSheet } from 'react-native';

export default class Chat extends React.Component {
  constructor() {
    super();
  }


  componentDidMount(){
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });
  }

  render() {
    let color=this.props.route.params.color;
    return (
      <View style={[{flex: 1}, {backgroundColor: color}]}>

      </View>
    )
  }
}