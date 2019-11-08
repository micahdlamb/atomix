import React, {useState, useEffect} from "react";
import { Link } from "react-router-dom";
import * as model from 'model'
import {Spinner, Message, getLatLng} from './common'
import MatchCard from './MatchCard'
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
// @material-ui/icons
import * as icons from "@material-ui/icons";
// core components
import Button from "components/CustomButtons/Button.js";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';

import CardInSpace from './CardInSpace'


const useStyles = makeStyles({
  table: {
    '& td': {
      textAlign: 'center',
      padding: '0 !important'
    }
  },
});

export default function FindPage() {

  return (
    <CardInSpace
      tabs={[
        {
          tabName: "Users",
          tabIcon: icons.SupervisedUserCircleSharp,
          tabContent: <MatchedUsers/>
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

function MatchedUsers(){

  let [matches, setMatches] = useState(null)

  useEffect(() => {
    async function find(){
      let matches = await model.findMatchedUsers()
      setMatches(matches)
    }
    find()
  }, [])

  if (!matches)
    return <Spinner/>
  if (matches.length === 0)
    return <Message>No Matches found</Message>

  return (
    <Grid>
      <Grid item lg={4} md={4} sm={6} xs={12}>
        {matches.map(match => <MatchCard match={match}/>)}
      </Grid>
    </Grid>
  )
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
    return <Message>No nearby playlists</Message>

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