#! /usr/bin/env python3

import sys
import time
import threading
from os.path import abspath, dirname, join
from subprocess import run
from wsgiref.simple_server import make_server

from nanohttp import text, json, context
from restfulpy.authorization import authorize
from restfulpy.application import Application
from restfulpy.authentication import StatefulAuthenticator
from restfulpy.controllers import RootController


__version__ = '0.1.0'

HERE = abspath(dirname(__file__))
KARMA_EXECUTABLE = '%s start karma.config.js' % join(HERE, '../node_modules/karma/bin/karma')


class MockupAuthenticator(StatefulAuthenticator):
    pass


class MockupApplication(Application):
    __authenticator__ = MockupAuthenticator()
    builtin_configuration = '''
    debug: true
    '''

    def __init__(self):
        super().__init__(
            'lemur',
            root=Root(),
            root_path=abspath(dirname(__file__)),
            version=__version__,
        )

    def insert_basedata(self):
        pass

    def insert_mockup(self):
        pass


class Root(RootController):

    @text
    def index(self):
        return 'Index'

    @json
    def echo(self):
        return context.form

    @text
    @authorize
    def protected(self):
        return 'Protected'

    @json
    def version(self):
        return {
            'version': __version__
        }


def main():
    app = MockupApplication()
    app.configure()
    httpd = make_server('localhost', 0, app)

    server_url = 'http://%s:%d' % httpd.server_address
    print('Serving %s' % server_url)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    try:
        server_thread.start()
        time.sleep(1)
        run('%s --server-url=%s' % (KARMA_EXECUTABLE, server_url), shell=True)
        return 0
    except KeyboardInterrupt:
        print('CTRL+X is pressed.')
        return 1
    finally:
        httpd.shutdown()
        server_thread.join()


if __name__ == '__main__':
    sys.exit(main())
