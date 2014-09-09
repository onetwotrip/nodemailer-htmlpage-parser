#!/bin/sh
#
# Add commit-msg hook which prepends branchname to all commit messages
#
echo "adding commit-msg hook"
cat <<- "EOF" > .git/hooks/commit-msg
	#!/bin/sh
	#
	# Automatically add branch name and branch description to every commit message except merge commit.
	#

	COMMIT_EDITMSG=$1

	addBranchName() {
	  NAME=$(git branch | grep '*' | sed 's/* //' | sed 's/\([A-Z]\+-[0-9]\+\).*/\1 v1/')
	  DESCRIPTION=$(git config branch."$NAME".description)
	  echo "$NAME: $(cat $COMMIT_EDITMSG)" > $COMMIT_EDITMSG
	  if [ -n "$DESCRIPTION" ]
	  then
		 echo "" >> $COMMIT_EDITMSG
		 echo $DESCRIPTION >> $COMMIT_EDITMSG
	  fi
	}

	MERGE=$(cat $COMMIT_EDITMSG|grep -i 'merge'|wc -l)

	if [ $MERGE -eq 0 ] ; then
	  addBranchName
	fi
EOF

chmod +x .git/hooks/commit-msg
