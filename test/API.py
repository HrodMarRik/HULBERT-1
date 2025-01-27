def API():
	data = {
		"noms" : "API",
		"version" : 0,
		"datas" : {
			"humains" : ["Romaric", "Kevin", "Sam"],
			"race" : ["humain", "puant", "chien"],
			"pronoms" : ["M", "M", "F"],
		},
	}
	return data

if __name__ == '__main__':
	print(API())