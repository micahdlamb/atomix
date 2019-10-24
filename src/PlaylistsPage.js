import React, {useState, useEffect} from "react";
import * as model from 'model'
// @material-ui/core components
import { Box } from '@material-ui/core';
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

// @material-ui/icons
import Face from "@material-ui/icons/Face";
import Chat from "@material-ui/icons/Chat";
import Build from "@material-ui/icons/Build";

import formStyle from './formStyle';
const useStyles = makeStyles(formStyle);

export default function PlaylistsPage() {

  return (
    <CardInSpace
      tabs={[
        {
          tabName: "Mine",
          tabIcon: Face,
          tabContent: <MyPlaylists/>
        },
        {
          tabName: "Joined",
          tabIcon: Chat,
          tabContent: <JoinedPlaylists/>
        },
        {
          tabName: "Find",
          tabIcon: Build,
          tabContent: "TODO"
        }
      ]}
    >

    </CardInSpace>
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
              <a href={playlist.join_url}><icons.Share/></a>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}

function JoinedPlaylists(){

  let [playlists, setPlaylists] = useState([])

  useEffect(() => {
    async function getPlaylists(){
      let playlists = await model.getJoinedPlaylists()
      setPlaylists(playlists)
    }
    getPlaylists()
  }, [])

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
              <a href={playlist.join_url}><icons.Share/></a>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  </>
}