import zerorpc


class test():
    def train(self):
        print("hello world")


if __name__ == '__main__':
    s = zerorpc.Server(test(), heartbeat=None)
    s.bind("tcp://0.0.0.0:42142")
    s.run()