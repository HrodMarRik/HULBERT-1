#!/bin/bash

sensors | grep Core | sed 's/([^)]*)//g; s/  */ /g; s/^ //'
