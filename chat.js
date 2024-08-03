console.log("Let the Music Begin");
// Initialize
let songIndex = 0;
let audioElement = new Audio("Ed-Sheeran.mp3");
let masterPlay = document.getElementById("masterPlay");
let myProgressBar = document.getElementById("myProgressBar");
let gif = document.getElementById("gif");
let masterSongName = document.getElementById("masterSongName");
let songItem = Array.from(document.getElementsByClassName("songItem"));
let songs = [
  {
    songName: "Perfect",
    filepath: "songs/Ed-Sheeran.mp3",
    coverPath: "covers/cover.jpg",
  },
  {
    songName: "Hymn For The Weekend",
    filepath: "songs/Coldplay - Hymn For The Weekend.mp3",
    coverPath: "covers/hmm.jpeg",
  },
  {
    songName: "Dancing With Your Ghost",
    filepath: "songs/Dancing With Your Ghost.mp3",
    coverPath: "covers/ghost.jpg",
  },
  {
    songName: "Heat Waves",
    filepath: "songs/Glass Animals - Heat Waves.mp3",
    coverPath: "covers/heatwave.jpg",
  },
  {
    songName: "Happier",
    filepath: "songs/happier.mp3",
    coverPath: "covers/happier.jpeg",
  },
  {
    songName: "Imagine Dragons",
    filepath: "songs/Imagine Dragons.mp3",
    coverPath: "covers/enemy.jpeg",
  },
  {
    songName: "Willow",
    filepath: "songs/willow.mp3",
    coverPath: "covers/willow.jpg",
  },
  {
    songName: "Believer",
    filepath: "songs/Imagine Dragons - Believer.mp3",
    coverPath: "covers/noThumbnail.jpg",
  },
];

// Set initial song data
function setSongData(index) {
  songIndex = index;
  audioElement.src = songs[index].filepath;
  masterSongName.innerText = songs[index].songName;
  audioElement.currentTime = 0;
  audioElement.play();
  masterPlay.classList.remove("fa-play-circle");
  masterPlay.classList.add("fa-pause-circle");
  gif.style.opacity = 1;
}

// Update song list elements
songItem.forEach((element, i) => {
  const coverImage = element.getElementsByTagName("img")[0];
  const songNameElement = element.getElementsByClassName("songName")[0];

  coverImage.src = songs[i].coverPath;
  songNameElement.innerText = songs[i].songName;

  // Add click event listener to each song item
  element.addEventListener("click", () => {
    setSongData(i);
  });
});

// Handle play/pause click
masterPlay.addEventListener("click", () => {
  if (audioElement.paused || audioElement.currentTime <= 0) {
    audioElement.play();
    masterPlay.classList.remove("fa-play-circle");
    masterPlay.classList.add("fa-pause-circle");
    gif.style.opacity = 1;
  } else {
    audioElement.pause();
    masterPlay.classList.remove("fa-pause-circle");
    masterPlay.classList.add("fa-play-circle");
    gif.style.opacity = 0;
  }
});

// Listen to timeupdate event
audioElement.addEventListener("timeupdate", () => {
  const progress = (audioElement.currentTime / audioElement.duration) * 100;
  myProgressBar.value = progress;
});

// Handle progress bar change
myProgressBar.addEventListener("input", () => {
  audioElement.currentTime =
    (myProgressBar.value / 100) * audioElement.duration;
});

// Initialize with the first song

document.getElementById("next").addEventListener("click", () => {
  if (songIndex >= songs.length - 1) {
    songIndex = 0;
  } else {
    songIndex += 1;
  }
  setSongData(songIndex);
});

document.getElementById("previous").addEventListener("click", () => {
  if (songIndex <= 0) {
    songIndex = songs.length - 1;
  } else {
    songIndex -= 1;
  }
  setSongData(songIndex);
});

setSongData(songIndex);
