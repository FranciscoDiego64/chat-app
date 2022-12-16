import React from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView, Button } from 'react-native';
import { GiftedChat, Bubble, InputToolbar } from 'react-native-gifted-chat';
import firebase from "firebase";
require('firebase/firestore');
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from '@react-native-community/netinfo';
import * as Permissions from 'expo-permissions';
import * as ImagePicker from 'expo-image-picker';
import CustomActions from "./CustomActions";
import MapView from "react-native-maps";

export default class Chat extends React.Component {
  constructor() {
    super();
    this.state = {
      messages: [],
      uid: 0,
      user: {
        _id: '',
        avatar: '',
        name: '',
      },
      isConnected: false,
      image: null,
      location: null
    };

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: "AIzaSyC2ut6OEtZ_wB-TOXasWgbVY_S5Bd8_LSQ",
        authDomain: "chat-app-15c01.firebaseapp.com",
        projectId: "chat-app-15c01",
        storageBucket: "chat-app-15c01.appspot.com",
        messagingSenderId: "648586594402",
        appId: "1:648586594402:web:6288c21882a95da4b6293b"
    
      });
    }

    this.referenceChatMessages = firebase.firestore().collection('messages');
  }

  //getMessages before componentdidmount
  async getMessages() {
    let messages = '';
    try {
      messages = await AsyncStorage.getItem('messages') || [];
      this.setState({
        messages: JSON.parse(messages)
      });
    } catch (error) {
      console.log(error.message);
    }
  };
  componentDidMount() {
    let name = this.props.route.params.name;
    this.props.navigation.setOptions({ title: name });
    this.getMessages();
    NetInfo.fetch().then(connection => {
      if (connection.isConnected) {
        this.setState({ isConnected: true });
        console.log('online');
      } else {
        console.log('offline');
      }
    });

    this.referenceChatMessages = firebase.firestore().collection('messages');
    this.unsubscribe = this.referenceChatMessages.onSnapshot(this.onCollectionUpdate);

    this.authUnsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        firebase.auth().signInAnonymously();
      }
    this.setState({
      uid: user.uid,
        messages: [],
        user: {
          _id: user.uid,
          name: name,
          avatar: 'https://placeimg.com/140/140/any',
        },
    });
    this.unsubscribe = this.referenceChatMessages
    .orderBy('createdAt', 'desc')
    .onSnapshot(this.onCollectionUpdate);
    this.saveMessages();
});
  }

  componentWillUnmount() {
    if (this.isConnected) {
    this.unsubscribe();
    this.authUnsubscribe();
  }
}

 //Appends new message to previous
  onSend(messages = []) {
    this.setState((previousState) => ({
      messages: GiftedChat.append(previousState.messages, messages),
    }),
    () => {
      this.addMessage();
      this.saveMessages();
    }
    );
  }
  async saveMessages(){
    try{
      await AsyncStorage.setItem('messages', JSON.stringify(this.state.messages));
    }
    catch(error){
      console.log(error.message);
    }
  }
  async deleteMessages() {
    try {
      await AsyncStorage.removeItem('messages');
      this.setState({
        messages: []
      })
    } catch (error) {
      console.log(error.message);
    }
  }
  addMessage = () => {
    const message = this.state.messages[0];
    this.referenceChatMessages.add({
      uid: this.state.uid,
      _id: message._id,
      text: message.text || '',
      createdAt: message.createdAt,
      user: message.user,
      image: message.image || null,
      location: message.location || null,
    });
  };
    //Bubble styling
    renderBubble(props) {
      return (
        <Bubble
          {...props}
          wrapperStyle={{
            left: {
              backgroundColor: 'white',
            },
            right: {
              backgroundColor: 'green'
            },
          }}
        />
      );
    }
    renderInputToolbar(props) {
      if (this.state.isConnected == false) {
      } else {
        return(
          <InputToolbar
          {...props}
          />
        );
      }
    }


    renderCustomActions = (props) => {
      return <CustomActions {...props} />;
  };

   //Returns MapView if message contains location data
   renderCustomView(props) {
    const { currentMessage } = props;
    if (currentMessage.location) {
        return (
            <MapView
                style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
                region={{
                    latitude: currentMessage.location.latitude,
                    longitude: currentMessage.location.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />
        );
    }
    return null;
  }


  onCollectionUpdate = (querySnapshot) => {
    const messages = [];
    // Loop through each document
    querySnapshot.forEach((doc) => {
      //Get the QueryDocumentSnapshot's data
      let data = doc.data();
      messages.push({
        _id: data._id,
        text: data.text,
        createdAt: data.createdAt.toDate(),
        user: {
          _id: data.user._id,
          name: data.user.name,
          avatar: data.user.avatar || '',
        },
        image: data.image || null,
        location: data.location || null,
      });
    });
    this.setState({
      messages,
    }) ;
  };

  render() {

    let color = this.props.route.params.color;
    return (
      <View style={{ flex: 1 ,

      backgroundColor: color,}} >
        <GiftedChat
          renderBubble={this.renderBubble.bind(this)}
          messages={this.state.messages}

          isConnected={this.state.isConnected}

          renderInputToolbar={this.renderInputToolbar.bind(this)}
          onSend={(messages) => this.onSend(messages)}
          user={{
            _id: this.state.user._id,
           
            avatar: this.state.user.avatar,
          }}
          renderActions={this.renderCustomActions}
          renderCustomView={this.renderCustomView}
        />

        {Platform.OS === "android" ? (
          <KeyboardAvoidingView behavior="height" />
        ) : null}
      </View>
    );
  }
}
