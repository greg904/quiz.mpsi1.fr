#!/bin/bash

pids=()

kill_bg() {
	for p in ${pids[@]}; do
		echo Killing $p...
                kill -TERM $p
        done
}

trap kill_bg EXIT

( cd server && npm run build && HTTP_PORT=3000 DB_PATH=db.sqlite3 DISCORD_CONFIG=711285096417853462:775038820533534731:0 node . ) &
pids+=($!)

cd front && npm run start
