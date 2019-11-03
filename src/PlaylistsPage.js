import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import * as model from 'model'
// @material-ui/core components
import { Box, CircularProgress } from '@material-ui/core';
import { makeStyles } from "@material-ui/core/styles";
import InputAdornment from "@material-ui/core/InputAdornment";
import { useSnackbar } from 'notistack';
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
  },
  table: {
    '& td': {
      textAlign: 'center',
      padding: '0 !important'
    }
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
          tabName: "Nearby",
          tabIcon: icons.Search,
          tabContent: <NearbyPlaylists/>
        }
      ]}
    />
  );
}

function MyPlaylists(){
  const classes = useStyles();
  const { enqueueSnackbar } = useSnackbar();

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

  async function toggleFindable(playlist){
    try {
      var latLng = playlist.latLng ? null : await getLatLng()
    } catch (error){
      enqueueSnackbar(error.message, {variant: 'error'})
      return
    }
    model.updatePlaylist(playlist.id, latLng)
    let newPlaylist = {...playlist, latLng}
    setPlaylists(playlists.map(p => p === playlist ? newPlaylist: p))
    let variant = latLng ? 'success': 'info'
    enqueueSnackbar(`${playlist.name} is ${latLng ? 'discoverable' : 'private'}`, {variant})
  }

  function deletePlaylist(playlist){
    model.deletePlaylist(playlist.id)
    setPlaylists(playlists.filter(p => p !== playlist))
  }

  function renderPlaylists(){
    if (!playlists)
      return <Spinner/>
    if (playlists.length === 0)
      return <Message>Create a playlist...</Message>

    return (
      <Table className={classes.table}>
        <TableBody>
          {playlists.map(playlist =>
            <TableRow key={playlist.id}>
              <TableCell>
                {playlist.name}
              </TableCell>
              <TableCell>
                <Button onClick={event => toggleFindable(playlist)} color='rose' round justIcon>
                  {playlist.latLng ? <icons.Visibility/>: <icons.VisibilityOff/>}
                </Button>
              </TableCell>
              <TableCell>
                <Button href={playlist.url} target='_blank' rel="noopener noreferrer" color='info' round justIcon>
                  <icons.OpenInNew/>
                </Button>
              </TableCell>
              <TableCell>
                {sharePlaylistButton(playlist)}
              </TableCell>
              <TableCell>
                <Button onClick={event => deletePlaylist(playlist)} color='danger' round justIcon>
                  <icons.Delete/>
                </Button>
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
        <Button type="submit" simple color="primary" disabled={!name}>
          Create
        </Button>
      </Box>
    </form>
    {renderPlaylists()}
  </>
}

function JoinedPlaylists(){
  const classes = useStyles();

  let [playlists, setPlaylists] = useState(null)

  useEffect(() => {
    async function getPlaylists(){
      let playlists = await model.getJoinedPlaylists()
      setPlaylists(playlists)
    }
    getPlaylists()
  }, [])

  function leavePlaylist(playlist){
    model.leavePlaylist(playlist.id)
    setPlaylists(playlists.filter(p => p !== playlist))
  }

  if (!playlists)
    return <Spinner/>
  if (playlists.length === 0)
    return <Message>No joined playlists</Message>

  return <>
    <Table className={classes.table}>
      <TableBody>
        {playlists.map(playlist =>
          <TableRow key={playlist.id}>
            <TableCell>
              {playlist.name}
            </TableCell>
            <TableCell>
              <Button href={playlist.url} target='_blank' rel="noopener noreferrer" color='info' round justIcon><icons.OpenInNew/></Button>
            </TableCell>
            <TableCell>
              {sharePlaylistButton(playlist)}
            </TableCell>
            <TableCell>
              <Button onClick={event => leavePlaylist(playlist)} color='danger' round justIcon>
                <icons.NotInterested/>
              </Button>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}

function NearbyPlaylists(){
  const classes = useStyles();

  let [playlists, setPlaylists] = useState(null)

  useEffect(() => {
    async function find(){
      try {
        let latLng = await getLatLng()
        let playlists = await model.findPlaylists(latLng)
        setPlaylists(playlists)
      } catch (error) {
        setPlaylists(error.message)
      }
    }
    find()
  }, [])

  if (typeof playlists === 'string')
    return <Message>{playlists}</Message>
  if (!playlists)
    return <Spinner/>
  if (playlists.length === 0)
    return <Message>No playlists found</Message>

  return <>
    <Table className={classes.table}>
      <TableBody>
        {playlists.map(playlist =>
          <TableRow key={playlist.id}>
            <TableCell>
              {playlist.name}
            </TableCell>
            <TableCell>
              <Button href={playlist.url} target='_blank' rel="noopener noreferrer" color='info' round justIcon><icons.OpenInNew/></Button>
            </TableCell>
            <TableCell>
              <Button component={Link} to={`/join/${playlist.id}`} color='success' round justIcon><icons.ArrowForward/></Button>
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
    return <Button onClick={handleClick} color='success' round justIcon><icons.Share/></Button>
  }

  // Clicking this should show a copy link popup
  return <Button component={Link} to={path} color='success' round justIcon><icons.Share/></Button>
}

// TODO why is it so hard to center something?
let Spinner = ()           => <Box display='flex' justifyContent='center'><CircularProgress color='secondary'/></Box>
let Message = ({children}) => <Box display='flex' justifyContent='center' m='1'>{children}</Box>

function getLatLng(){
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async pos => resolve([pos.coords.latitude, pos.coords.longitude]),
      error => reject(error),
      {
        enableHighAccuracy: true
      }
    )
  })
}