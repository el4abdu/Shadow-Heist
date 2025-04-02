# Shadow Heist

A multiplayer social deduction game inspired by games like Among Us and Werewolf, where players take on the roles of thieves planning a heist, but some are traitors working for the security forces.

## 🎮 Game Overview

In Shadow Heist, players are assigned one of several roles:

- **Master Thief (Hero)** – Knows one innocent player. Can "lockpick" to delay sabotage.
- **Hacker (Hero)** – Can reveal a player's true alignment once per game.
- **Infiltrator (Traitor)** – Sabotages tasks secretly. Can frame a player as suspicious.
- **Double Agent (Traitor)** – Appears innocent in investigations. Can fake tasks.
- **Civilians (Neutral)** – Must complete tasks to win but can be framed.

The game cycles through different phases:
- **Night Phase**: Secret actions (sabotage, investigation)
- **Day Phase**: Discussion
- **Task Phase**: Complete mini-games to progress
- **Voting Phase**: Decide who to banish

**Win Conditions**:
- **Heroes/Civilians**: Complete all tasks OR banish all traitors
- **Traitors**: Sabotage enough tasks OR outnumber the heroes

## 🚀 Technology Stack

This game is built using:
- **Frontend**: HTML5, CSS3, JavaScript
- **Real-time Communication**: Socket.io
- **Backend**: Node.js with Express

## 🏗️ Project Structure

```
shadow-heist/
├── index.html            # Main HTML file
├── css/
│   └── style.css         # Stylesheet
├── js/
│   ├── game.js           # Main game logic
│   ├── tasks.js          # Task mini-games
│   └── ui.js             # UI components and utilities
├── server.js             # Socket.io server
└── package.json          # Project dependencies
```

## 🛠️ Setup & Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/shadow-heist.git
   cd shadow-heist
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

## 🚢 Deployment

This project can be easily deployed to platforms like:

- **Netlify**: Connect your repository and configure to use the following build command: `npm run build`
- **Vercel**: Simply connect your repository and Vercel will automatically detect the configuration
- **Heroku**: Use the Procfile to define how to start the application

## 🎲 How to Play

1. **Create or Join a Room**: Enter your name and either create a new room or join an existing one with a room code.

2. **Role Assignment**: Each player is secretly assigned a role at the start of the game.

3. **Game Phases**:
   - During night phase, traitors can sabotage and heroes can use abilities.
   - During day phase, all players discuss and share information.
   - During task phase, complete mini-games to progress the heist.
   - During voting, vote to banish suspicious players.

4. **Win the Game**: Heroes need to complete tasks or identify traitors, while traitors need to sabotage or remain hidden long enough.

## 📱 Responsive Design

The game is designed to work on desktop and mobile devices with a responsive layout.

## 🧩 Future Enhancements

- Additional roles with unique abilities
- More varied and complex tasks
- Custom game settings (time limits, task counts, etc.)
- Persistent accounts and statistics
- Voice chat integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Have fun playing Shadow Heist! Remember, trust no one... complete the heist! 