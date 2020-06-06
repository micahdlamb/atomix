import React, {useState, useEffect} from "react";
import * as model from 'model'
import {Spinner, Message} from './common'
import CardInSpace from './CardInSpace'
import { makeStyles } from "@material-ui/core/styles";
import * as icons from "@material-ui/icons";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';



export default function BeatSaverPage() {

  return (
    <CardInSpace
      tabs={[
        {
          tabName: "Beat Saver",
          tabIcon: icons.QueueMusic,
          tabContent: <MatchedSongs/>
        },
      ]}
    />
  );
}

const useStyles = makeStyles((theme) => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
}));

function MatchedSongs(){
  const classes = useStyles();
  let [matches, setMatches] = useState(null)

  useEffect(() => {
    async function find(){
      let matches = await model.findBeatSaverMatches()
      setMatches(matches)
    }
    find()
  }, [])

  if (!matches)
    return <Spinner/>
  if (matches.length === 0)
    return <Message>No Matches found</Message>

  return (
    <List className={classes.root}>
      {matches.map(song =>
        <ListItem button component="a" href={`https://bsaber.com/songs/${song.id}`}>
          <ListItemAvatar>
            <Avatar src={`https://beatsaver.com${song.coverURL}`} alt=''/>
          </ListItemAvatar>
          <ListItemText primary={song.songName} secondary={song.songAuthorName} />
        </ListItem>
      )}
    </List>
  );
}
