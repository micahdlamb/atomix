import React, {useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import * as model from 'model'
// @material-ui/core components
import { Box, CircularProgress } from '@material-ui/core';
// @material-ui/icons
import * as icons from "@material-ui/icons";
// core components
import Button from "components/CustomButtons/Button.js";

import CardInSpace from './CardInSpace'


export default function(props) {

  return (
    <CardInSpace
      tabs={[
        {
          tabName: "Join",
          tabIcon: icons.DeviceHub,
          tabContent: <JoinPlaylist {...props}/>
        }
      ]}
    />
  );
}

function JoinPlaylist(){

  let {playlist_id} = useParams()
  console.log(playlist_id)
  let [response, setResponse] = useState(null)
  let [playlist, setPlaylist] = useState(null)

  useEffect(() => {
    async function getPlaylist(){
      let playlist = await model.getPlaylist(playlist_id)
      setPlaylist(playlist)
    }
    getPlaylist()
  }, [playlist_id])

  async function join(){
    let response = await model.joinPlaylist(playlist_id)
    setResponse(response)
  }

  if (!playlist)
    return <Box display='flex' justifyContent='center'><CircularProgress/></Box>

  return (
    <Box display='flex' justifyContent='center'>
      {response ?
        JSON.stringify(response)
      :
        <Button onClick={join} color="primary" size="lg">Join {playlist.name}</Button>
      }
    </Box>
  )
}