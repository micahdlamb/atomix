import React, {useState, useEffect} from "react";
import { useParams, useHistory } from "react-router-dom";
import * as model from 'model'
// @material-ui/core components
import { Box, CircularProgress } from '@material-ui/core';
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
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
      headerColor='primary'
    />
  );
}

function JoinPlaylist(){

  let {playlist_id} = useParams()
  let history       = useHistory()

  let [playlist, setPlaylist] = useState(null)
  let [give, setGive] = useState('likes')

  useEffect(() => {
    async function getPlaylist(){
      let playlist = await model.getPlaylist(playlist_id)
      setPlaylist(playlist)
    }
    getPlaylist()
  }, [playlist_id])

  async function join(){
    window.open(playlist.url)
    await model.joinPlaylist(playlist_id, give)
    history.push('/playlists')
  }

  if (!playlist)
    return <Spinner/>

  return <>
    <GridContainer style={{textAlign: 'center'}}>
      <GridItem sm={6}>
        <Button onClick={join} color="rose" size="lg" round>Join {playlist.name}</Button>
      </GridItem>
      <GridItem sm={6}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Contribute</FormLabel>
          <RadioGroup value={give} onChange={event => setGive(event.target.value)}>
            <FormControlLabel value="likes"     control={<Radio/>} label="Likes" />
            <FormControlLabel value="playlists" control={<Radio/>} label="Playlists" />
          </RadioGroup>
        </FormControl>
      </GridItem>
    </GridContainer>
  </>
}

// TODO commonize code with identical components on PlaylistsPage
let Spinner = () => <Box display='flex' justifyContent='center'><CircularProgress color='secondary'/></Box>