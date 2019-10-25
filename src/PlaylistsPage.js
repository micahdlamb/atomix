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
  let [playlists, setPlaylists] = useState([])

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
    let playlist = await model.createPlaylist(name)
    setPlaylists([playlist].concat(playlists))
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
              <Link to={`/join/${playlist.id}`}><icons.Share/></Link>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
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
    return <Box display='flex' justifyContent='center'><CircularProgress/></Box>
  if (playlists.length === 0)
    return <Box display='flex' justifyContent='center'>No joined playlists</Box>

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
              <Link to={`/join/${playlist.id}`}><icons.Share/></Link>
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
    return <Box display='flex' justifyContent='center'><CircularProgress/></Box>
  if (playlists.length === 0)
    return <Box display='flex' justifyContent='center'>No playlists found</Box>

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
              <Link to={`/join/${playlist.id}`}><icons.Share/></Link>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}