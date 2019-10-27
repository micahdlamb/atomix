import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import * as model from 'model'
// @material-ui/core components
import { Box, CircularProgress } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
// @material-ui/icons
import * as icons from "@material-ui/icons";
// core components
import Button from "components/CustomButtons/Button.js";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import CustomInput from "components/CustomInput/CustomInput.js";
import CardInSpace from './CardInSpace'


const useStyles = makeStyles({
  inputIconsColor: {
    color: "#495057"
  }
});

export default function PlaylistsPage() {

  return (
    <CardInSpace
      tabs={[
        {
          tabName: "Mine",
          tabIcon: icons.PlaylistAdd,
          tabContent: <MyPlaylists/>
        },
        {
          tabName: "Joined",
          tabIcon: icons.DeviceHub,
          tabContent: <JoinedPlaylists/>
        },
        {
          tabName: "Find",
          tabIcon: icons.Search,
          tabContent: <FindPlaylists/>
        }
      ]}
    />
  );
}

function MyPlaylists(){
  const classes = useStyles();

  let [name, setName] = useState("")
  let [playlists, setPlaylists] = useState(null)

  useEffect(() => {
    async function getPlaylists(){
      let playlists = await model.getMyPlaylists()
      setPlaylists(playlists)
    }
    getPlaylists()
  }, [])

  async function handleSubmit(event){
    event.preventDefault()
    if (!name) return
    // TODO need ui to input latLng. Maybe a google map
    let playlist = await model.createPlaylist(name)
    setPlaylists([playlist].concat(playlists))
    // TODO need ui to input give=likes/playlists
    model.joinPlaylist(playlist.id)
  }

  function renderPlaylists(){
    if (!playlists)
      return <Spinner/>
    if (playlists.length === 0)
      return <Message>Create a playlist...</Message>

    return (
      <Table>
        <TableBody>
          {playlists.map(playlist =>
            <TableRow key={playlist.id}>
              <TableCell>
                {playlist.name}
              </TableCell>
              <TableCell>
                <a href={playlist.url} target='_blank' rel="noopener noreferrer"><icons.OpenInNew/></a>
              </TableCell>
              <TableCell>
                {sharePlaylistButton(playlist)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    )
  }

  return <>
    <form onSubmit={handleSubmit}>
      <Box display='flex'>
        <CustomInput
          labelText="Name..."
          id="first"
          formControlProps={{
            fullWidth: true
          }}
          inputProps={{
            type: "text",
            endAdornment: (
              <InputAdornment position="end">
                <icons.MusicNote className={classes.inputIconsColor} />
              </InputAdornment>
            ),
            value: name,
            onChange: event => setName(event.target.value)
          }}
        />
        <Button type="submit" simple color="primary" size="lg" disabled={!name}>
          Create
        </Button>
      </Box>
    </form>
    {renderPlaylists()}
  </>
}

function JoinedPlaylists(){

  let [playlists, setPlaylists] = useState(null)

  useEffect(() => {
    async function getPlaylists(){
      let playlists = await model.getJoinedPlaylists()
      setPlaylists(playlists)
    }
    getPlaylists()
  }, [])

  if (!playlists)
    return <Spinner/>
  if (playlists.length === 0)
    return <Message>No joined playlists</Message>

  return <>
    <Table>
      <TableBody>
        {playlists.map(playlist =>
          <TableRow key={playlist.id}>
            <TableCell>
              {playlist.name}
            </TableCell>
            <TableCell>
              <a href={playlist.url} target='_blank' rel="noopener noreferrer"><icons.OpenInNew/></a>
            </TableCell>
            <TableCell>
              {sharePlaylistButton(playlist)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}

function FindPlaylists(){

  let [playlists, setPlaylists] = useState(null)

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(async pos => {
      let latLng = [pos.coords.latitude, pos.coords.longitude]
      let playlists = await model.findPlaylists(latLng)
      setPlaylists(playlists)
    })
  }, [])

  if (!playlists)
    return <Spinner/>
  if (playlists.length === 0)
    return <Message>No playlists found</Message>

  return <>
    <Table>
      <TableBody>
        {playlists.map(playlist =>
          <TableRow key={playlist.id}>
            <TableCell>
              {playlist.name}
            </TableCell>
            <TableCell>
              <a href={playlist.url} target='_blank' rel="noopener noreferrer"><icons.OpenInNew/></a>
            </TableCell>
            <TableCell>
              {sharePlaylistButton(playlist)}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}

let sharePlaylistButton = playlist =>
  <ShareButton
    title={`Join the ${playlist.name} Playlist! `}
    text={`${playlist.owner} wants your musical input.`}
    path={`/join/${playlist.id}`}
  />

function ShareButton({title, text, path}){
  // navigator.share only exists on mobile and https
  if (navigator.share){
    let url = window.location.origin+path
    let handleClick = event => navigator.share({title, text, url})
    return <Button onClick={handleClick} color='primary'><icons.Share/></Button>
  }

  // Clicking this should show a copy link popup
  return <Link to={path}><icons.Share/></Link>
}

// TODO why is it so hard to center something?
let Spinner = ()           => <Box display='flex' justifyContent='center'><CircularProgress color='secondary'/></Box>
let Message = ({children}) => <Box display='flex' justifyContent='center' m='1'>{children}</Box>